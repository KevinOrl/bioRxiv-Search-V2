import os
import json
import logging
import glob
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, split, trim, regexp_replace, to_date, date_format, initcap, udf, struct, to_json
from pyspark.sql.types import ArrayType, StructType, StructField, StringType
import pymongo

# Logger Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
AUGMENTED_FOLDER = "/mnt/augmented"
MONGO_URI = os.getenv("MONGO_URI")
PROCESSED_LOG = "/mnt/augmented/.processed_files.json"

# Function to transform author names: "First Name, Last Name" -> "Last Name, First Name"
# def transform_author_name(author_name):
#     if not author_name:
#         return author_name
#     parts = author_name.strip().split()
#     if len(parts) >= 2:
#         return f"{parts[-1]}, {' '.join(parts[:-1])}"
#     return author_name

# UDF (User defined function) to extract and concatenate author names
def extract_author_names(rel_authors):
    if rel_authors is None:
        return ""
    return ", ".join([a.get("author_name", "") for a in rel_authors])

# UDF to extract and concatenate author institutions
def extract_author_insts(rel_authors):
    if rel_authors is None:
        return ""
    return "; ".join([a.get("author_inst", "") for a in rel_authors])

extract_author_insts_udf = udf(extract_author_insts, StringType())
extract_author_names_udf = udf(extract_author_names, StringType())

# Function to transform author names: "First Name, Last Name" -> "Last Name, First Name"
def transform_author_name(author_name):
    if not author_name:
        return author_name
    # If there are several authors separated by a comma, transform each one
    names = [name.strip() for name in author_name.split(",")]
    result = []
    for name in names:
        parts = name.strip().split()
        if len(parts) >= 2:
            result.append(f"{parts[-1]}, {' '.join(parts[:-1])}")
        else:
            result.append(name)
    return ", ".join(result)

# Register as UDF for use in Spark
transform_author_name_udf = udf(transform_author_name, StringType())

# Definir el esquema para rel_authors con author_inst como array
rel_authors_schema = ArrayType(
    StructType([
        StructField("author_name", StringType(), True),
        StructField("author_inst", ArrayType(StringType()), True)
    ])
)

# UDF para transformar nombres de autor y separar instituciones dentro de la estructura anidada
def transform_nested_authors(rel_authors):
    if rel_authors is None or not isinstance(rel_authors, list):
        return rel_authors
        
    transformed = []
    for author in rel_authors:
        if author:
            author = author.copy()  # Crear copia para no modificar el original
            
            # Transformar author_name a formato "Apellido, Nombre"
            if "author_name" in author and author["author_name"]:
                name = author["author_name"]
                parts = name.strip().split()
                if len(parts) >= 2:
                    author["author_name"] = f"{parts[-1]}, {' '.join(parts[:-1])}"
            
            # Separar author_inst en componentes individuales
            if "author_inst" in author and author["author_inst"]:
                # Dividir por punto y coma, coma, o punto, que son separadores comunes
                if any(sep in author["author_inst"] for sep in [";", ",", "."]):
                    # Dividir por varios separadores posibles
                    for sep in [";", ","]:
                        if sep in author["author_inst"]:
                            institutions = [inst.strip() for inst in author["author_inst"].split(sep)]
                            # Filtrar instituciones vacías
                            author["author_inst"] = [inst for inst in institutions if inst]
                            break
                else:
                    # Si no hay separador, mantenerlo como una lista de un elemento
                    author["author_inst"] = [author["author_inst"]]
                    
        transformed.append(author)
    return transformed

# Registrar el UDF con el esquema correcto
transform_nested_authors_udf = udf(transform_nested_authors, rel_authors_schema)

# Loads the list of files already processed
def load_processed_files():
    if os.path.exists(PROCESSED_LOG):
        try:
            with open(PROCESSED_LOG, 'r') as f:
                return set(json.load(f))
        except:
            return set()
    return set()

# Saves the list of processed files
def save_processed_files(processed):
    try:
        with open(PROCESSED_LOG, 'w') as f:
            json.dump(list(processed), f)
    except Exception as e:
        logger.error(f"Error saving processed file: {e}")

# Process a single file with Spark transformations
def process_file(spark, filename):
    logger.info(f"Processing file: {filename}")
    filepath = os.path.join(AUGMENTED_FOLDER, filename)
    
    if not os.path.exists(filepath):
        logger.warning(f"File not found: {filepath}")
        return False
    
    try:
        # Load the JSON as text and then as a DataFrame
        with open(filepath, "r", encoding="utf-8") as f:
            json_content = f.read()
        
        # Parse JSON and create DataFrame
        json_data = json.loads(json_content)
        collection_data = json_data.get("collection", [])
        
        if not collection_data:
            logger.warning(f"No data collections in {filepath}")
            return True  # We consider it processed even if it is empty
        
        # First create the author_name column from rel_authors
        df = spark.createDataFrame(collection_data)

        transformed_df = df \
            .withColumn("rel_authors", transform_nested_authors_udf(col("rel_authors"))) \
            .withColumn("category", initcap(trim(col("category")))) \
            .withColumn("rel_date", date_format(to_date(col("rel_date"), "yyyy-MM-dd"), "dd/MM/yyyy"))
        # Convert to MongoDB format and save
        mongo_df = transformed_df.select(to_json(struct("*")).alias("json"))
        documents = [json.loads(row.json) for row in mongo_df.collect()]
        
        # Save in MongoDB
        client = pymongo.MongoClient(MONGO_URI)
        db = client.get_database()
        documents_collection = db.documents
        
        if documents:
            # Insert with upsert based on rel_doi to avoid duplicates
            for doc in documents:
                if doc.get("rel_doi"):
                    documents_collection.update_one(
                        {"rel_doi": doc["rel_doi"]}, 
                        {"$set": doc}, 
                        upsert=True
                    )
                else:
                    documents_collection.insert_one(doc)
                    
            logger.info(f"{len(documents)} documents processed in file {filename}")
        
        client.close()
        return True
    
    except Exception as e:
        logger.error(f"Error processing {filename}: {e}")
        return False

def main():
    logger.info("Starting SparkSQLJobProcessor")
    
    # Initialize Spark
    spark = SparkSession.builder \
        .appName("SparkSQLJobProcessor") \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:3.0.1") \
        .getOrCreate()
    
    try:
        # Load log of already processed files
        processed_files = load_processed_files()
        
        # Get all JSON files in the augmented folder
        json_files = glob.glob(os.path.join(AUGMENTED_FOLDER, "*.json"))
        
        # Process only previously unprocessed files
        newly_processed = set()
        for filepath in json_files:
            filename = os.path.basename(filepath)
            if filename not in processed_files:
                success = process_file(spark, filename)
                if success:
                    newly_processed.add(filename)
        
        # Update and save the list of processed files
        processed_files.update(newly_processed)
        save_processed_files(processed_files)
        
        logger.info(f"Processed completed. {len(newly_processed)} new processed files.")
    
    except Exception as e:
        logger.error(f"General error in the processor {e}")
    
    finally:
        spark.stop()
        logger.info("SparkSQLJobProcessor finished.")

if __name__ == "__main__":
    main()