FROM python:3.13-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ghostscript && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy only requirements first for better caching
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./

# Expose the default FastAPI port
EXPOSE 8080

# Start the server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
