FROM python:3.9-slim

WORKDIR /app

# Install Java for Spark
# Installing system and Java dependencies for Spark
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openjdk-17-jre-headless \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Copy only requirements.txt first to take advantage of the cache
COPY app/requirements.txt .


# Install Python Dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY app/. .



# Command to run the application
CMD ["python", "app.py"]