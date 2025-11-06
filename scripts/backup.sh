#!/bin/bash

# Backup script for database and uploads

set -e

BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="$BACKUP_DIR/postgresql_$TIMESTAMP.sql"

echo "========================================"
echo "Question Generator - Backup Script"
echo "========================================"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL Database
echo "Backing up PostgreSQL..."
docker-compose exec -T postgres pg_dump -U question_user question_generator > "$DB_BACKUP_FILE" || \
    docker exec question_postgres_prod pg_dump -U question_user question_generator > "$DB_BACKUP_FILE" || true

# Backup uploads directory
echo "Backing up uploads..."
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" ./data/uploads/ || true

# Create backup list
echo "Backup list:"
ls -lh "$BACKUP_DIR" | tail -10

echo "========================================"
echo "Backup Complete!"
echo "========================================"
