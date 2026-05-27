#!/bin/bash
cd "$(dirname "$0")"

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Stop proces op poort $port (PID: $pids)..."
    kill -9 $pids 2>/dev/null
    sleep 1
  fi
}

# Probeer poort 3000 vrij te maken (max 3x)
for _ in 1 2 3; do
  kill_port 3000
  if ! lsof -ti :3000 >/dev/null 2>&1; then
    export PORT=3000
    break
  fi
done

# Als 3000 nog bezet is, gebruik 3001
if lsof -ti :3000 >/dev/null 2>&1; then
  echo ""
  echo "Waarschuwing: poort 3000 blijft bezet door een ander programma."
  kill_port 3001
  export PORT=3001
  echo "MSN Messenger start op poort 3001 in plaats daarvan."
  echo ""
fi

echo "Open in je browser: http://localhost:${PORT}"
exec node server.js
