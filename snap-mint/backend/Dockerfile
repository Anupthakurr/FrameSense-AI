FROM python:3.13-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Northflank will set PORT env var)
EXPOSE 5000

# Start gunicorn
CMD gunicorn app:app \
    --bind "0.0.0.0:${PORT:-5000}" \
    --timeout 300 \
    --workers 1 \
    --threads 8
