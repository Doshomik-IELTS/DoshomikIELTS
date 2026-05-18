#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/tmp/ieltspp-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ieltspp_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"

echo "Starting database backup at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup complete: $BACKUP_FILE ($BACKUP_SIZE)"

find "$BACKUP_DIR" -name "ieltspp_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"

echo "Backup finished at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
