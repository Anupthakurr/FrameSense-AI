FROM python:3.13-slim

# Install system dependencies + Node.js 20
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install bgutil PO Token provider globally
RUN npm install -g bgutil-ytdlp-pot-provider

# Copy application code
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Expose port (Northflank will set PORT env var)
EXPOSE 5000

# Use start.sh to launch bgutil + gunicorn
CMD ["./start.sh"]
