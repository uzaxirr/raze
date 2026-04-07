#!/bin/bash

echo "=== Container starting ==="
echo "PWD: $(pwd)"
echo "Files in /app:"
ls -la /app/ | head -20
echo "=== Starting supervisord ==="
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
