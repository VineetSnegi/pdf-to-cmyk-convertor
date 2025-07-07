FROM python:3.13-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ghostscript && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    google-cloud-storage \
    google-cloud-firestore

# Copy app files
COPY . /app
WORKDIR /app

# Expose the default FastAPI port
EXPOSE 8080

# Start the server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]