#!/bin/bash
cd "$(dirname "$0")"

# Check if authtoken is configured
if ! ~/.local/bin/ngrok config check 2>/dev/null | grep -q "valid"; then
    echo "⚠️  ngrok needs an authtoken!"
    echo ""
    echo "1. Sign up at https://ngrok.com (free)"
    echo "2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "3. Run: ~/.local/bin/ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    exit 1
fi

echo "🚀 Starting ngrok tunnel..."
~/.local/bin/ngrok http 8080 --domain="" 2>&1 | tee ngrok.log &

# Wait a moment for ngrok to start
sleep 3

# Extract and display the public URL
URL=$(grep -o 'https://[a-z0-9-]*\.ngrok-free\.app' ngrok.log | head -1)

if [ -n "$URL" ]; then
    echo ""
    echo "✅ Dashboard is now PUBLIC!"
    echo ""
    echo "🔗 Your URL: $URL"
    echo ""
    echo "📱 Add to iPhone home screen:"
    echo "   1. Open Safari → Go to $URL"
    echo "   2. Tap Share → 'Add to Home Screen'"
    echo ""
    echo "⚠️  Anyone with this link can see your dashboard"
    echo "   Press Ctrl+C to stop the tunnel"
else
    echo "⏳ Starting up... check ngrok.log for the URL"
fi

wait