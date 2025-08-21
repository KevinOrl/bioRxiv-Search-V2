bioRxiv Search V2 

This repository contains the implementation of bioRxiv Search V2, a distributed system designed to search and process scientific articles related to COVID-19 using data from the bioRxiv API. The project was developed collaboratively as part of an academic initiative focused on integrating SQL and NoSQL databases, data processing, and microservices architecture.

Project Goals

- Develop a functional prototype using both SQL and NoSQL databases.
- Implement a REST API crawler in Python to retrieve scientific articles.
- Process and transform data using Spark SQL.
- Automate the entire solution using Docker, Kubernetes, and Helm Charts.
- Deploy microservices and shared volumes in Kubernetes.
- Extract named entities using SpaCy.
- Index and search documents using MongoDB Atlas Search.
- Build a responsive web application using generative AI tools.

System Overview

The system follows a modular, event-driven architecture:
- Controller: Monitors MongoDB Atlas for new jobs and splits article retrieval tasks.
- API Crawler: Downloads article data from the bioRxiv API and stores raw files in a shared volume.
- SpaCy Entity Extractor: Performs Named Entity Recognition and augments the data.
- SparkSQL Processor: Applies transformations to metadata and publishes cleaned documents to MongoDB.
- MongoDB Atlas Search: Enables full-text search with facets, highlighting, and custom mappings.
- REST API (Node.js): Hosted on Vercel, connects the frontend with MongoDB Atlas and Firestore.
- Frontend (React + Vite + TailwindCSS): Allows users to register, log in, and search/filter articles interactively.

Technologies Used

- Languages: Python, JavaScript (Node.js, React)
- Databases: MongoDB Atlas, Firestore (NoSQL), Spark SQL (processing)
- Search Engine: MongoDB Atlas Search
- Data Extraction: SpaCy (NER)
- Containerization: Docker
- Orchestration: Kubernetes + Helm Charts
- Messaging: RabbitMQ
- Frontend: React, Vite, TailwindCSS
- Hosting: Vercel
- AI Tools: Generative AI for UI design and prototyping

Deliverables

- Fully automated system with Dockerfiles, Docker Compose, and Helm Charts.
- Markdown-based documentation compiled into PDF.
- Unit tests for all core components.
- Clear execution instructions and reproducible test cases.
- Architecture and flow diagrams.
- Final report with recommendations and conclusions.

Academic Context

This project was developed as part of a university course focused on software architecture and data engineering. It emphasizes best practices in programming, documentation, testing, and automation. All components are designed to be modular, scalable, and cloud-ready.
