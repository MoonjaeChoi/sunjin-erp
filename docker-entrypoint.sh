#!/bin/sh
# Docker entrypoint script for sunjin-erp
# Runs database migrations before starting the application

set -e

echo "=================================================="
echo "🚀 Sunjin ERP Application Startup"
echo "=================================================="
echo ""

# Check environment variables
if [ -z "$ORACLE_HOST" ]; then
  echo "❌ Error: ORACLE_HOST not set"
  exit 1
fi

if [ -z "$ORACLE_USERNAME" ] || [ -z "$ORACLE_PASSWORD" ]; then
  echo "❌ Error: ORACLE_USERNAME or ORACLE_PASSWORD not set"
  exit 1
fi

echo "✓ Environment configured"
echo "  Host: $ORACLE_HOST"
echo "  User: $ORACLE_USERNAME"
echo ""

# Run migrations
echo "🔄 Running database migrations..."
cd /app

if [ -f "scripts/run-migrations.js" ]; then
  node scripts/run-migrations.js || {
    echo "⚠️  Migration script failed, but continuing with app startup"
  }
else
  echo "⚠️  Migration script not found at scripts/run-migrations.js"
fi

echo ""
echo "=================================================="
echo "✅ Starting application server..."
echo "=================================================="
echo ""

# Start the application
exec node server.js
