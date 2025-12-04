#!/bin/sh
set -e

echo "Running database migrations..."
bun run prisma:deploy

echo "Starting server..."
exec bun run start