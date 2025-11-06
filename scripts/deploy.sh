#!/bin/bash

# Deployment script for production environment

set -e

echo "========================================"
echo "Question Generator - Production Deploy"
echo "========================================"

# Check environment
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create .env file first."
    exit 1
fi

# Build production images
echo "Building production images..."
docker-compose -f docker-compose.prod.yml build

# Pull latest base images
echo "Pulling latest images..."
docker-compose -f docker-compose.prod.yml pull

# Stop existing services
echo "Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

# Start services
echo "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 15

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head || true

echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Application is running in production mode."
echo "View logs with: docker-compose -f docker-compose.prod.yml logs -f"
