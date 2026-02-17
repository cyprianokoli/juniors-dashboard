#!/bin/bash
# Dashboard auto-start script

# Kill any existing servers
pkill -f "python3 -m http.server" 2>/dev/null
pkill -f "localtunnel" 2>/dev/null
pkill -f "lt" 2>/dev/null
sleep 2

# Start Python server
cd /home/cyprian/.openclaw/workspace/dashboard
python3 -m http.server 8080 > server.log 2>&1 &
sleep 3

# Start localtunnel
npx localtunnel --port 8080 --subdomain junior-dashboard-$(date +%s) > tunnel.log 2>&1 &
sleep 6

# Get the URL
URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.loca\.lt' tunnel.log | head -1)

if [ -n "$URL" ]; then
    echo "Dashboard started at: $URL"
    echo "IP for tunnel password: $(curl -s https://api.ipify.org)"
    # Save URL to file
    echo "$URL" > current_url.txt
    echo "$(date): $URL" >> url_history.log
else
    echo "Failed to get tunnel URL"
    echo "$(date): Failed to start" >> url_history.log
fi
