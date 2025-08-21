import os
import pymongo
import pika
import json
import time
import requests
import logging

# Logger Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
mongo_uri = os.getenv('MONGO_URI')
rabbitmq_host = os.getenv("RABBITMQ_HOST")
rabbitmq_user = os.getenv("RABBITMQ_USER")
rabbitmq_pass = os.getenv("RABBITMQ_PASS")
rabbitmq_queue = os.getenv("RABBITMQ_QUEUE")
bioRxiv_api_url = os.getenv('BIORXIV_API_URL')

# Connecting to MongoDB
client = pymongo.MongoClient(mongo_uri)
db = client.get_database()
jobs_collection = db.jobs

def get_total_articles_from_biorxiv():
    """Obtiene el número total de artículos de COVID-19 desde bioRxiv"""
    try:
        response = requests.get(f"{bioRxiv_api_url}")
        if response.status_code == 200:
            data = response.json()
            logger.info(f"API Response: {data}")  # Corregido: usa f-string para el logging
            
            # Extraer el total desde messages[0]['total']
            if isinstance(data, dict) and "messages" in data and isinstance(data["messages"], list):
                total = data["messages"][0].get("total", 0)
                logger.info(f"Total articles found: {total}")
                return total
            else:
                logger.warning("Unexpected API response structure")
                return 0
        else:
            logger.warning(f"Error in bioRxiv API call: {response.status_code}")
            return 0
    except Exception as e:
        logger.error(f"Error calling bioRxiv API: {str(e)}")
        return 0

def watch_jobs():
    """Monitorea continuamente la colección de jobs en MongoDB"""
    while True:
        # Buscamos cualquier job no procesado anteriormente
        job_document = jobs_collection.find_one()

        if job_document:
            logger.info(f"Processing Job: {job_document}")

            try:
                # Extraer información del job según el formato requerido
                # El jobId puede estar en el documento o usar el _id si no está presente
                job_id = job_document.get("jobId", str(job_document["_id"]))
                page_size = int(job_document.get("pageSize"))
                sleep_ms = int(job_document.get("sleep"))

                # Obtener el total de artículos (sin usar query)
                total_messages = get_total_articles_from_biorxiv()
                
                if total_messages == 0:
                    logger.info("No articles found from bioRxiv API.")
                    # Eliminamos el job y continuamos
                    jobs_collection.delete_one({"_id": job_document["_id"]})
                    continue

                # Calculamos el número de splits
                num_splits = total_messages // page_size
                if total_messages % page_size > 0:
                    num_splits += 1
                
                logger.info(f"Total articles: {total_messages}, Number of splits: {num_splits}")
                
                # Actualizamos con el número total de splits
                jobs_collection.update_one(
                    {"_id": job_document["_id"]},
                    {"$set": {"splitNumber": num_splits, "totalArticles": total_messages}}
                )
                
                # Conectamos a RabbitMQ
                credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
                connection = pika.BlockingConnection(
                    pika.ConnectionParameters(host=rabbitmq_host, credentials=credentials)
                )
                channel = connection.channel()
                channel.queue_declare(queue=rabbitmq_queue, durable=True)

                # Publicamos los splits con el formato exacto requerido
                for i in range(num_splits):
                    message = {
                        "jobId": job_id,
                        "pageSize": page_size,
                        "sleep": sleep_ms,
                        "splitNumber": i
                    }
                    
                    channel.basic_publish(
                        exchange='',
                        routing_key=rabbitmq_queue,
                        body=json.dumps(message),
                        properties=pika.BasicProperties(delivery_mode=2)
                    )
                    logger.info(f"Published split {i+1}/{num_splits}")
                    time.sleep(sleep_ms / 1000)

                # Eliminar el job una vez procesado
                jobs_collection.delete_one({"_id": job_document["_id"]})
                logger.info(f"Job {job_id} processed successfully")

            except Exception as e:
                logger.error(f"Error when processing job: {str(e)}")
            finally:
                try:
                    if 'connection' in locals() and connection and connection.is_open:
                        connection.close()
                except Exception as e:
                    logger.error(f"Error closing RabbitMQ connection: {str(e)}")

        # Esperar antes de la próxima verificación
        time.sleep(3)

if __name__ == "__main__":
    logger.info("Controller started. Watching for jobs...")
    watch_jobs()