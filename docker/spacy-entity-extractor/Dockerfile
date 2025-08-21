FROM python:3.12.4-slim-bookworm

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update -y && \
    apt-get install -y build-essential && \
    apt-get clean

# Copy the application files
COPY app/. .

# Install Python Dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Command to run the application
CMD ["python", "-u", "app.py"]