#!/bin/bash
# $1 is the username

# Current directory is ~/Documents/Repositorios Bases II/Repositorio Grupal/2025-01-IC4302-PO/PO/docker
# Navigate to the api directory
cd controller
docker build -t $1/controller .
docker push $1/controller


# Navigate to the api-crowler directory
cd ../api-crawler
cd api-crawler
docker build -t $1/api-crawler .
docker push $1/api-crawler


# # # # Navigate back and then to spacy-entity-extractor
cd ../spacy-entity-extractor
docker build -t $1/spacy-entity-extractor .
docker push $1/spacy-entity-extractor

# # # Navegar a UI y construir la imagen
cd ../spark-job-processor
docker build -t $1/spark-job-processor .
docker push $1/spark-job-processor


# View running containers
docker ps