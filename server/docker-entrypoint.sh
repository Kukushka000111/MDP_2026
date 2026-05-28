#!/bin/sh
set -e

echo "Applying database schema..."
node scripts/run-sql.js ../../db/schema.sql

echo "Applying seed data..."
node scripts/run-sql.js ../../db/seed.sql

echo "Starting API..."
exec "$@"
