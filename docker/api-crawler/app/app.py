import os
import pika
import json
import requests
import logging
import time

# Logger configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST")
RABBITMQ_USER = os.getenv("RABBITMQ_USER")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS")
RABBITMQ_QUEUE = os.getenv("RABBITMQ_QUEUE")
BIORXIV_API_URL = os.getenv("BIORXIV_API_URL")
RAW_FOLDER = "/mnt/raw"
RABBITMQ_DONE_QUEUE = os.getenv("RABBITMQ_QUEUE_DOWNLOAD")

# Ensure all required environment variables are set
def download_and_save(jobId, splitNumber, pageSize):
    """
    Descarga artículos para un split específico.
    Cada split comprende pageSize páginas de la API.
    Combina todos los artículos en un solo archivo JSON.
    """
    # Obtener la URL base sin el número de página
    base_url = BIORXIV_API_URL
    if base_url.endswith('/0'):
        base_url = base_url[:-1]  # Quitar el último carácter ('0')
    
    # Calcular el rango de páginas para este split
    pages_per_split = pageSize  # pageSize representa páginas por split (100)
    start_page = splitNumber * pages_per_split
    end_page = start_page + pages_per_split - 1
    
    logger.info(f"Processing split {splitNumber}: API pages {start_page} to {end_page}")
    
    # Estructura para combinar todos los artículos del split
    combined_data = {
        "messages": [],
        "collection": []
    }
    
    articles_downloaded = 0
    pages_processed = 0
    
    for page_num in range(start_page, end_page + 1):
        # Construir la URL para esta página
        url = f"{base_url}{page_num}"
        logger.info(f"Requesting page {page_num} from: {url}")
        
        try:
            response = requests.get(url)
            response.raise_for_status()  # Lanza una excepción si hay error HTTP
            data = response.json()
            
            if not isinstance(data, dict) or "messages" not in data or "collection" not in data:
                logger.warning(f"Page {page_num} response is not in the expected format.")
                continue
                
            # Verificar si hay artículos en esta página
            articles_in_page = len(data.get("collection", []))
            if articles_in_page == 0:
                logger.warning(f"No articles found on page {page_num}")
                # Si no hay artículos, podemos haber llegado al final de la colección
                if page_num > start_page + 10:  # Si ya procesamos algunas páginas, terminamos
                    logger.info(f"Reached end of collection at page {page_num}")
                    break
                else:
                    continue
            
            # Guardar los mensajes de la primera página (contiene metadatos importantes)
            if not combined_data["messages"] and "messages" in data:
                combined_data["messages"] = data["messages"].copy()
            
            # Añadir artículos a la colección combinada
            combined_data["collection"].extend(data.get("collection", []))
            articles_downloaded += articles_in_page
            pages_processed += 1
            
            logger.info(f"Added {articles_in_page} articles from page {page_num}, total so far: {articles_downloaded}")
            
            # Esperar brevemente entre solicitudes para no sobrecargar la API
            time.sleep(0.5)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error requesting page {page_num}: {e}")
            # Intentar hasta 3 veces si hay error de conexión
            if "Connection" in str(e) and page_num < end_page:
                for retry in range(3):
                    logger.info(f"Retrying page {page_num} (attempt {retry+1}/3)")
                    time.sleep(5)  # Esperar más tiempo antes de reintentar
                    try:
                        response = requests.get(url)
                        response.raise_for_status()
                        data = response.json()
                        
                        if "collection" in data:
                            combined_data["collection"].extend(data.get("collection", []))
                            articles_downloaded += len(data.get("collection", []))
                            pages_processed += 1
                            logger.info(f"Retry successful for page {page_num}")
                            break
                    except:
                        logger.error(f"Retry {retry+1} failed for page {page_num}")
        except Exception as e:
            logger.error(f"Unexpected error processing page {page_num}: {e}")
    
    # Si hemos descargado artículos, guardar el archivo combinado
    if articles_downloaded > 0:
        # Actualizar el conteo en messages
        if combined_data["messages"]:
            # Actualizar el contador para reflejar el número real de artículos
            for i, msg in enumerate(combined_data["messages"]):
                if "count" in msg:
                    combined_data["messages"][i]["count"] = len(combined_data["collection"])
        
        # Guardar el archivo combinado para todo el split
        combined_filename = f"{jobId}_{splitNumber}.json"
        combined_filepath = os.path.join(RAW_FOLDER, combined_filename)
        
        with open(combined_filepath, "w", encoding="utf-8") as f:
            json.dump(combined_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Split {splitNumber}: Saved combined file with {articles_downloaded} articles from {pages_processed} pages")
    else:
        logger.warning(f"No articles were downloaded for split {splitNumber}")
        combined_filepath = None
    
    # Crear el archivo de resumen (mantenemos esto para compatibilidad)
    summary_filename = f"{jobId}_summary_{splitNumber}.json"
    summary_filepath = os.path.join(RAW_FOLDER, summary_filename)
    
    with open(summary_filepath, "w", encoding="utf-8") as f:
        summary = {
            "jobId": jobId,
            "splitNumber": splitNumber,
            "startPage": start_page,
            "endPage": end_page if pages_processed == 0 else start_page + pages_processed - 1,
            "pagesProcessed": pages_processed,
            "totalArticlesDownloaded": articles_downloaded
        }
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Split {splitNumber} completed: Downloaded {articles_downloaded} articles across {pages_processed} pages")
    
    # Devolver la ruta del archivo combinado o None si no se descargó nada
    return combined_filepath or summary_filepath

def get_rabbitmq_connection(purpose="consume", retry_count=3, heartbeat=30):
    """
    Establece una conexión con RabbitMQ para un propósito específico.
    
    Args:
        purpose: 'consume' o 'publish' 
        retry_count
        heartbeat: intervalo de heartbeat en segundos
    
    Returns:
        Tuple (connection, channel) o (None, None) si falla
    """
    for attempt in range(retry_count):
        try:
            # Ajustar parámetros según el propósito
            if purpose == "publish":
                # Para publicar: conexión más ligera, timeout corto
                connection_params = pika.ConnectionParameters(
                    host=RABBITMQ_HOST,
                    credentials=pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS),
                    heartbeat=heartbeat,
                    blocked_connection_timeout=30,
                    connection_attempts=2
                )
            else:
                # Para consumir: timeout más largo, más reintentos
                connection_params = pika.ConnectionParameters(
                    host=RABBITMQ_HOST,
                    credentials=pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS),
                    heartbeat=heartbeat,
                    blocked_connection_timeout=60,
                    connection_attempts=5
                )
                
            # Establecer conexión
            connection = pika.BlockingConnection(connection_params)
            channel = connection.channel()
            
            # Declarar colas según el propósito
            if purpose == "consume":
                channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)
                channel.queue_declare(queue=RABBITMQ_DONE_QUEUE, durable=True)
                channel.basic_qos(prefetch_count=1)
            elif purpose == "publish":
                channel.queue_declare(queue=RABBITMQ_DONE_QUEUE, durable=True)
                
            logger.info(f"Connected to RabbitMQ for {purpose}")
            return connection, channel
            
        except Exception as e:
            wait_time = min(2 ** attempt, 30)
            logger.error(f"Error connecting to RabbitMQ (attempt {attempt+1}/{retry_count}): {e}")
            if attempt < retry_count - 1:
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            
    logger.critical(f"Failed to connect to RabbitMQ after {retry_count} attempts")
    return None, None

# Callback function to process messages from RabbitMQ
def callback(ch, method, properties, body):
    # ACK temprano para evitar reprocesamiento
    ch.basic_ack(delivery_tag=method.delivery_tag)
    
    try:
        msg = json.loads(body)
        logger.info(f"Received: {msg}")
        jobId = msg["jobId"]
        splitNumber = msg["splitNumber"]
        pageSize = msg["pageSize"]
        
        # Desconectar antes de la descarga larga
        ch.connection.close()
        logger.info("Closed RabbitMQ connection before download")
        
        # Descargar y guardar (sin conexión activa)
        filepath = download_and_save(jobId, splitNumber, pageSize)
        logger.info(f"Saved in {filepath}")
        
        # Mensaje de finalización
        done_msg = {
            "jobId": jobId,
            "pageSize": pageSize,
            "sleep": msg.get("sleep", 0),
            "splitNumber": splitNumber,
            "status": "DOWNLOADED"
        }
        
        # Crear nueva conexión para publicar
        publish_conn, publish_ch = get_rabbitmq_connection(purpose="publish")
        if publish_ch:
            publish_ch.basic_publish(
                exchange='',
                routing_key=RABBITMQ_DONE_QUEUE,
                body=json.dumps(done_msg),
                properties=pika.BasicProperties(delivery_mode=2)
            )
            logger.info(f"Published completion message for split {splitNumber}")
            publish_conn.close()
        else:
            logger.error("Failed to publish completion message - couldn't connect to RabbitMQ")
        
    except Exception as e:
        logger.error(f"Error in callback: {e}")

def main():
    while True:
        # Obtener conexión para consumir
        connection, channel = get_rabbitmq_connection(purpose="consume")
        
        if not channel:
            logger.error("Failed to get RabbitMQ connection, retrying in 10 seconds...")
            time.sleep(10)
            continue
            
        try:
            channel.basic_consume(queue=RABBITMQ_QUEUE, on_message_callback=callback)
            logger.info("Waiting for messages...")
            channel.start_consuming()
        except Exception as e:
            logger.error(f"Error consuming messages: {e}")
            
        # Si llegamos aquí, hubo un error. Esperar antes de reconectar
        time.sleep(5)

if __name__ == "__main__":
    os.makedirs(RAW_FOLDER, exist_ok=True)
    main()
