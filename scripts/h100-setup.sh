#!/bin/bash
# H100 Setup Script for Capitalism Simulation
# Run this on the H100 server after cloning the repo

set -e

echo "========================================"
echo "H100 Capitalism Simulation Setup"
echo "========================================"

# Check for NVIDIA GPU
if ! nvidia-smi &> /dev/null; then
    echo "ERROR: nvidia-smi not found. Make sure NVIDIA drivers are installed."
    exit 1
fi

echo "GPU detected:"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
echo ""

# Check for Docker with NVIDIA runtime
if ! docker info 2>/dev/null | grep -q "nvidia"; then
    echo "WARNING: NVIDIA Docker runtime may not be configured."
    echo "Install with: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html"
fi

# Get MacBook IP
if [ -z "$MACBOOK_IP" ]; then
    echo ""
    echo "Enter your MacBook's IP address (where gateway is running):"
    read -p "> " MACBOOK_IP
fi

export MACBOOK_IP

# Test connection to MacBook gateway
echo ""
echo "Testing connection to gateway at $MACBOOK_IP:8000..."
if curl -s --connect-timeout 5 "http://$MACBOOK_IP:8000" > /dev/null; then
    echo "✓ Gateway is reachable"
else
    echo "✗ Cannot reach gateway at http://$MACBOOK_IP:8000"
    echo "  Make sure:"
    echo "  1. docker-compose up -d is running on MacBook"
    echo "  2. Firewall allows port 8000"
    echo "  3. Both machines are on same network"
    exit 1
fi

# Optional: Set HuggingFace token for gated models
if [ -z "$HF_TOKEN" ]; then
    echo ""
    echo "HuggingFace token (for Llama-3.1, press Enter to skip if already cached):"
    read -p "> " HF_TOKEN
    if [ -n "$HF_TOKEN" ]; then
        export HF_TOKEN
    fi
fi

echo ""
echo "========================================"
echo "Starting H100 Inference Services"
echo "========================================"

# Build and start
docker-compose -f docker-compose.h100-inference.yml build
docker-compose -f docker-compose.h100-inference.yml up -d

echo ""
echo "Services starting... vLLM will take 2-3 minutes to load the model."
echo ""
echo "Monitor startup with:"
echo "  docker-compose -f docker-compose.h100-inference.yml logs -f vllm"
echo ""
echo "Once ready, check agent service:"
echo "  curl http://localhost:8001/"
echo ""
echo "To run simulation:"
echo "  # Create 100 agents"
echo "  curl -X POST http://localhost:8001/agents/population -H 'Content-Type: application/json' -d '{\"count\": 100}'"
echo ""
echo "  # Start simulation (100 ticks)"
echo "  curl -X POST http://localhost:8001/simulation/start -H 'Content-Type: application/json' -d '{\"ticks\": 100, \"tick_interval\": 5.0}'"
echo ""
echo "  # Monitor progress"
echo "  curl http://localhost:8001/simulation/status"
echo ""
echo "  # Export data when done"
echo "  curl -X POST http://localhost:8001/export/all"
