import os
import json
import pika
import spacy
import logging

RAW_FOLDER = "/mnt/raw"
AUGMENTED_FOLDER = "/mnt/augmented"

# Logger Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables for RabbitMQ
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST")
RABBITMQ_USER = os.getenv("RABBITMQ_USER")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS")
RABBITMQ_QUEUE = os.getenv("RABBITMQ_QUEUE_DOWNLOAD")  # Queue where the api-crawler publishes the downloaded files

# Load the Spacy model
nlp = spacy.load("en_core_web_sm")

# process_file function to read, process, and save the file
def process_file(filename):
    raw_path = os.path.join(RAW_FOLDER, filename)
    augmented_path = os.path.join(AUGMENTED_FOLDER, filename)
    if not os.path.exists(raw_path):
        logger.warning(f"File not found: {raw_path}")
        return
    with open(raw_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Process each document in collection
    for doc in data.get("collection", []):
        text = doc.get("rel_abs", "")
        spacy_doc = nlp(text)
        entities = [{"text": ent.text, "label": ent.label_} for ent in spacy_doc.ents]
        doc["entities"] = entities
    # Save the enlarged file
    with open(augmented_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"Processed and saved in: {augmented_path}")

# callback function to process messages from RabbitMQ
def callback(ch, method, properties, body):
    msg = json.loads(body)
    logger.info(f"Received: {msg}")
    jobId = msg["jobId"]
    splitNumber = msg["splitNumber"]
    filename = f"{jobId}_{splitNumber}.json"
    process_file(filename)
    ch.basic_ack(delivery_tag=method.delivery_tag)

def main():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)
    )
    channel = connection.channel()
    channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=RABBITMQ_QUEUE, on_message_callback=callback)
    logger.info("Waiting for RAW file messages to process entities...")
    channel.start_consuming()

if __name__ == "__main__":
    main()