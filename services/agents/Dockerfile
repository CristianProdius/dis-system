# AI Agent Service Dockerfile
# For development: use standard Python image
# For H100 production: use NVIDIA CUDA image with vLLM

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies (without vLLM for basic image)
# For H100, use the nvidia/cuda base image and install vLLM
RUN pip install --no-cache-dir -r requirements.txt || \
    pip install --no-cache-dir \
    fastapi==0.108.0 \
    uvicorn==0.25.0 \
    httpx==0.26.0 \
    pydantic==2.5.0 \
    redis==5.0.1 \
    prometheus-client==0.19.0 \
    python-dotenv==1.0.0

# Copy source code
COPY src ./src

# Expose port
EXPOSE 8001

# Run the service
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
