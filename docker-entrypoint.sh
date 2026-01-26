#!/bin/sh
# Docker entrypoint script for sunjin-erp
# Runs database migrations before starting the application

set -e

echo "=================================================="
echo "🚀 Sunjin ERP Application Startup"
echo "=================================================="

# Check environment variables
if [ -z "$ORACLE_HOST" ]; then
  echo "❌ Error: ORACLE_HOST environment variable not set"
  exit 1
fi

if [ -z "$ORACLE_USERNAME" ] || [ -z "$ORACLE_PASSWORD" ]; then
  echo "❌ Error: ORACLE_USERNAME or ORACLE_PASSWORD not set"
  exit 1
fi

echo "✓ Environment variables configured"
echo "  Host: $ORACLE_HOST"
echo "  Service: $ORACLE_SERVICE_NAME"
echo "  User: $ORACLE_USERNAME"

# Create a simple TypeORM config for migrations
echo ""
echo "📝 Creating TypeORM configuration..."

cat > /tmp/typeorm-config.js << 'EOF'
module.exports = {
  type: 'oracle',
  host: process.env.ORACLE_HOST,
  port: parseInt(process.env.ORACLE_PORT || '1521'),
  serviceName: process.env.ORACLE_SERVICE_NAME || 'XEPDB1',
  username: process.env.ORACLE_USERNAME,
  password: process.env.ORACLE_PASSWORD,
  entities: ['src/entities/*.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.LOG_LEVEL === 'debug'
};
EOF

# Try to run migrations
echo ""
echo "🔄 Attempting to run database migrations..."
cd /app

# Check if migrations directory exists
if [ -d "src/migrations" ]; then
  echo "✓ Migrations directory found"

  # Count migrations
  MIGRATION_COUNT=$(find src/migrations -name "*.ts" 2>/dev/null | wc -l)
  echo "  Found $MIGRATION_COUNT migration files"
else
  echo "⚠️  Migrations directory not found at src/migrations"
fi

# Try to run migrations using npx typeorm (if available)
if command -v npx >/dev/null 2>&1; then
  echo "  Running: npx typeorm migration:run..."
  npx typeorm migration:run \
    --dataSource /tmp/typeorm-config.js \
    2>&1 || true
else
  echo "⚠️  npx not available, skipping migrations"
fi

echo ""
echo "=================================================="
echo "✅ Starting application server..."
echo "=================================================="

# Start the application
exec node server.js
