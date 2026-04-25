#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "📦 Installing backend deps..."
cd "$ROOT/backend"
[ ! -d node_modules ] && npm install --legacy-peer-deps --silent
[ ! -d node_modules/ai ] && npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/groq --legacy-peer-deps --silent

echo "📦 Installing dashboard deps..."
cd "$ROOT/dashboard"
[ ! -d node_modules ] && npm install --legacy-peer-deps --silent

echo "🚀 Starting backend + dashboard..."
# Start backend in background, dashboard in foreground
npm run dev &
BACKEND_PID=$!

cd "$ROOT/dashboard"
npm run dev &
DASHBOARD_PID=$!

echo ""
echo "✅ Running:"
echo "   Backend   → http://localhost:3001"
echo "   Dashboard → http://localhost:5173"
echo "   Marketplace → http://localhost:5173/agents/marketplace"
echo "   Deploy    → http://localhost:5173/agents/deploy"
echo ""
echo "Press Ctrl+C to stop both."

# Kill both on exit
trap "kill $BACKEND_PID $DASHBOARD_PID 2>/dev/null" EXIT
wait
