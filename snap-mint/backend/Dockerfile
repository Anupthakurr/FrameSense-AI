# Use Python as the base
FROM python:3.13-slim

# 1. Install System Dependencies (ffmpeg for video, libGL for OpenCV)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Node.js (Required for your bgutil PO Token engine)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

# 3. Copy and Install Python Requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy and Install Node Requirements (for the bgutil engine)
COPY package*.json ./
RUN npm install

# 5. Copy the rest of your code
COPY . .

# Ensure your start script is executable
RUN chmod +x start.sh

# Expose port
EXPOSE 5000

# Start the Node engine and Python app via your script
CMD ["./start.sh"]
