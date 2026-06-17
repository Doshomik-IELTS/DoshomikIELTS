#!/bin/bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-doshomikielts}"
DOCKER_COMPOSE="${DOCKER_COMPOSE:-docker-compose.yml}"
TAG_FILE="${TAG_FILE:-.deployed-tags}"
ROLLBACK_TAG="${1:-}"

echo "Rolling back deployment..."

if [ -n "$ROLLBACK_TAG" ]; then
  echo "Rolling back to specified tag: $ROLLBACK_TAG"
  TARGET_TAG="$ROLLBACK_TAG"
else
  if [ ! -f "$TAG_FILE" ]; then
    echo "No deployment history found at $TAG_FILE"
    echo "Usage: $0 [image-tag]"
    exit 1
  fi

  CURRENT_TAG=$(tail -n 1 "$TAG_FILE" 2>/dev/null || echo "")
  PREVIOUS_TAG=$(tail -n 2 "$TAG_FILE" | head -n 1 2>/dev/null || echo "")

  if [ -z "$PREVIOUS_TAG" ]; then
    echo "No previous deployment found in history."
    echo "Deployment history:"
    cat "$TAG_FILE"
    exit 1
  fi

  TARGET_TAG="$PREVIOUS_TAG"
  echo "Current tag:  $CURRENT_TAG"
  echo "Rolling back to: $TARGET_TAG"
fi

FULL_IMAGE="${IMAGE_NAME}:${TARGET_TAG}"

echo "Pulling image: $FULL_IMAGE"
docker pull "$FULL_IMAGE"

echo "Updating compose to use $FULL_IMAGE..."
docker compose -f "$DOCKER_COMPOSE" up -d --force-recreate app worker

echo "Rollback complete. Verifying health..."
sleep 5

HEALTH=$(curl -sf http://localhost:3000/api/health 2>/dev/null || echo '{"status":"unknown"}')
echo "Health check: $HEALTH"

if [ -f "$TAG_FILE" ]; then
  sed -i '$ d' "$TAG_FILE"
fi
echo "$TARGET_TAG" >> "$TAG_FILE"

echo "Rollback to $TARGET_TAG complete."
echo "If health check shows degraded, run: docker compose -f $DOCKER_COMPOSE restart app worker"
