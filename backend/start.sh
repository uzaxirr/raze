#!/bin/bash

echo "=== Container starting ==="
echo "PWD: $(pwd)"

# Run database migrations automatically
echo "=== Running database migrations ==="
cd /app/db && python -m alembic upgrade head 2>&1 && echo "Migrations applied" || echo "Migration failed (continuing anyway)"
cd /app

echo "=== Starting supervisord ==="
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
