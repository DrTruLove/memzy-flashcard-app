# Quick Server Fix

## If you see "ERR_CONNECTION_REFUSED" or "localhost refused to connect"

Run this command:
```bash
./restart-server.sh
```

Or run it from anywhere:
```bash
/Users/dawnclarke/Downloads/memzy-flashcard-app/restart-server.sh
```

This script will:
1. Check if the server is running
2. Kill any existing processes
3. Restart the dev server automatically
4. Verify it's working

---

## Manual Alternative

If the script doesn't work, run manually:
```bash
cd /Users/dawnclarke/Downloads/memzy-flashcard-app
pkill -f "next dev"
pnpm dev
```

---

## Server Info
- **URL**: http://localhost:3000
- **Port**: 3000
- **Command**: `pnpm dev`
- **Project**: Memzy Flashcard App
