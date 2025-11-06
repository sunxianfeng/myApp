#!/bin/bash

# Setup script for Question Generator Application

set -e

echo "========================================"
echo "Question Generator - Setup Script"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Copying .env.example to .env..."
    cp .env.example .env
    echo "Please edit .env file with your configuration."
fi

# Create necessary directories
echo "Creating data directories..."
mkdir -p data/uploads
mkdir -p data/generated
mkdir -p data/backups

# Pull latest images
echo "Pulling Docker images..."
docker-compose pull

# Build images
echo "Building Docker images..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker-compose exec -T backend alembic upgrade head || true

echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Services are now running:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - MinIO: http://localhost:9001"
echo ""
echo "View logs with: docker-compose logs -f"
