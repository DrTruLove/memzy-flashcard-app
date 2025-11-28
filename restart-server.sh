#!/bin/bash

# Auto-restart dev server script for Memzy Flashcard App
# This script checks if localhost:3000 is responding and restarts if needed

PROJECT_DIR="/Users/dawnclarke/Downloads/memzy-flashcard-app"
PORT=3000

echo "🔍 Checking if dev server is running on port $PORT..."

# Check if server is responding
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    echo "✅ Server is already running at http://localhost:$PORT"
    exit 0
fi

echo "❌ Server not responding (HTTP $HTTP_CODE)"
echo "🔄 Restarting dev server..."

# Kill any existing Next.js processes
pkill -f "next dev" 2>/dev/null

# Wait a moment for processes to terminate
sleep 2

# Start the dev server in the background
cd "$PROJECT_DIR"
echo "🚀 Starting: pnpm dev"
pnpm dev > /dev/null 2>&1 &

# Wait for server to start
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
    sleep 1
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        echo "✅ Server is now running at http://localhost:$PORT"
        echo "🌐 Open your browser to: http://localhost:$PORT"
        exit 0
    fi
    echo -n "."
done

echo ""
echo "⚠️  Server may still be starting. Check manually at http://localhost:$PORT"
echo "   Or run: cd $PROJECT_DIR && pnpm dev"
