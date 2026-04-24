#!/usr/bin/env bash
# Waits for the backend API to be available, then generates OpenAPI types.

API_URL="${API_URL:-http://localhost:8000/api-docs-json}"
MAX_RETRIES=30
INTERVAL=2

echo "⏳ Waiting for backend at $API_URL ..."

for i in $(seq 1 $MAX_RETRIES); do
  if curl -s --fail "$API_URL" > /dev/null 2>&1; then
    echo "✅ Backend is up! Generating API types..."
    npx openapi-typescript "$API_URL" -o src/lib/api/schema.d.ts
    exit $?
  fi
  echo "   Attempt $i/$MAX_RETRIES — retrying in ${INTERVAL}s..."
  sleep $INTERVAL
done

echo "❌ Backend not available after $((MAX_RETRIES * INTERVAL))s. Starting without fresh types."
exit 0
