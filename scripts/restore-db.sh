#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/tmp/doshomikielts-backups}"
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/doshomikielts_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "No backups found in $BACKUP_DIR"
  exit 1
fi

DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"

echo "WARNING: This will REPLACE the current database with $LATEST_BACKUP"
echo "Database: $DATABASE_URL"
echo "Press Ctrl+C to cancel, or wait 10 seconds to proceed..."
sleep 10

echo "Restoring from $LATEST_BACKUP at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

gunzip -c "$LATEST_BACKUP" | psql "$DATABASE_URL"

echo "Restore complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
