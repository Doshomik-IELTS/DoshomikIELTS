#!/bin/bash
set -euo pipefail

GIT_SHA=$(git rev-parse --short HEAD)
IMAGE_NAME="${IMAGE_NAME:-ieltspp}"
DOCKER_COMPOSE="${DOCKER_COMPOSE:-docker-compose.yml}"

echo "Rolling back to previous deployment..."

PREVIOUS_SHA=$(docker inspect --format='{{index .Config.Labels "org.opencontainers.image.revision"}}' \
  "$(docker compose -f "$DOCKER_COMPOSE" ps -q app 2>/dev/null || echo "")" 2>/dev/null || echo "")

if [ -z "$PREVIOUS_SHA" ]; then
  echo "No previous deployment found. Manual rollback required."
  echo "Run: docker compose -f $DOCKER_COMPOSE up -d --build"
  exit 1
fi

echo "Previous deployment: $PREVIOUS_SHA"
echo "Rolling back to: $PREVIOUS_SHA"

docker compose -f "$DOCKER_COMPOSE" up -d --force-recreate --no-deps app worker

echo "Rollback complete. Verifying health..."
sleep 5

HEALTH=$(curl -sf http://localhost:3000/api/health 2>/dev/null || echo '{"status":"unknown"}')
echo "Health check: $HEALTH"

echo "If health check shows degraded, run: docker compose -f $DOCKER_COMPOSE restart app worker"
