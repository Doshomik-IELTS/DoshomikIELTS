#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/tmp/doshomikielts-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/doshomikielts_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_NAME="${CONTAINER_NAME:-doshomikielts-db-1}"

mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

docker exec "$CONTAINER_NAME" pg_dump -U postgres doshomikielts | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup complete: $BACKUP_FILE ($BACKUP_SIZE)"

find "$BACKUP_DIR" -name "doshomikielts_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"

echo "Backup finished at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
