# Junior's Personal Dashboard

A Progressive Web App (PWA) for tracking my 90-day certification challenge and daily productivity.

**Live URL:** https://juniors-dashboard.pages.dev

**Demo (with sample data):** https://juniors-dashboard.pages.dev/demo.html

> ⚠️ **Privacy Note:** The demo uses fake data. Your personal dashboard is private and requires authentication.

## What It Does

- **90-Day Challenge Tracker** - Network+ → Security+ → Real Estate App
- **Daily Schedule** - Morning routine, study blocks, work shifts
- **Spaced Repetition** - Study topics with SM-2 algorithm
- **Streak Counter** - Network+, French, Gym
- **AI Assistant** - Floating chat button for quick help
- **Offline-First** - Works without internet, syncs when back online

## Architecture

### Frontend
- **3-Page PWA**: Home (essentials), Stats (progress), Settings (config)
- **localStorage** - Primary data storage (works offline)
- **Service Worker** - Caching, background sync, push notifications

### Backend (Optional)
- **Node.js + Express** - Local API server
- **Cloudflare Tunnel** - Exposes local backend to the web
- **REST API** - `/api/health`, `/api/sync`, `/api/ai`

### Hosting
- **Cloudflare Pages** - Static frontend (always online)
- **Local Server + Tunnel** - Dynamic backend (when laptop is on)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, CSS3, HTML5 |
| Backend | Node.js, Express |
| Data | localStorage + JSON file |
| Hosting | Cloudflare Pages + Tunnel |
| PWA | Service Worker, Web App Manifest |

## File Structure

```
dashboard/
├── index.html          # Main page (daily essentials)
├── stats.html          # Progress tracking
├── settings.html       # Configuration
├── server.js           # Local backend API
├── service-worker.js   # PWA offline support
├── manifest.json       # PWA manifest
├── package.json        # Node dependencies
├── start-dashboard.sh  # Auto-start script
├── icon.svg            # App icons
└── apple-touch-icon.png
```

## Key Features

### 1. Today's Schedule (with sub-tasks)
- Main checkbox checks all sub-tasks
- Tap to expand for details
- Progress indicator (e.g., "2/4 done")

### 2. Backend Sync
```javascript
// Frontend tries backend first, falls back to localStorage
const API_BASE_URL = 'https://juniors-dashboard.pages.dev/api';

async function syncData() {
  try {
    await fetch(`${API_BASE_URL}/sync`, { method: 'POST', body: data });
  } catch {
    // Fallback: save to localStorage
    localStorage.setItem('data', JSON.stringify(data));
  }
}
```

### 3. Service Worker (v4)
- **Network-first** for HTML (fresh content)
- **Cache-first** for assets (fast loading)
- Background sync for offline actions

## Running Locally

### Frontend Only (Static)
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

### With Backend
```bash
# Terminal 1 - Start backend
npm install
node server.js

# Terminal 2 - Expose to internet (optional)
cloudflared tunnel --url http://localhost:8080
```

## Auto-Start on Boot

Cron job configured to:
- Start server on boot
- Check every 5 minutes, restart if crashed

```cron
@reboot /path/to/dashboard/start-dashboard.sh
*/5 * * * * pgrep -f "node server.js" || /path/to/dashboard/start-dashboard.sh
```

## Lessons Learned

1. **Service Worker Strategy Matters**
   - Cache-first broke navigation between pages
   - Network-first for HTML, cache-first for assets = ✓

2. **Offline-First Design**
   - Assume backend is offline
   - Queue changes, sync when connected
   - Better UX than "loading..." spinners

3. **Constraint = Clarity**
   - Forced "essentials only" on main screen
   - Moved everything else to dedicated pages
   - Result: cleaner, faster, more focused

## Push Notifications

**Status:** Supported but not yet enabled

**Requirements:**
- ✅ Android (Chrome) - Full support
- ⚠️ iOS (Safari 16.4+) - Only works when added to home screen
- ❌ Requires backend server to send notifications (can't schedule locally)

**How it would work:**
1. User enables notifications in Settings
2. Service worker registers with browser's push service
3. Backend sends push notifications via Cloudflare/FCM
4. Notifications appear even when app is closed

**Current limitation:** Notifications need the backend running. Since the backend is local (on your laptop), notifications only work when your computer is on and connected.

**Solution:** Move backend to cloud (Railway/Render) for 24/7 notifications.

## Roadmap

- [ ] Native app wrapper (Capacitor?)
- [ ] Push notifications for study reminders
- [ ] Database backend (PostgreSQL)
- [ ] Multi-device sync
- [ ] Analytics dashboard

## 90-Day Challenge

| Phase | Days | Goal | Status |
|-------|------|------|--------|
| 1 | 1-30 | Network+ Cert | In Progress |
| 2 | 31-60 | Security+ Cert | Planned |
| 3 | 61-90 | Real Estate App MVP | Planned |

---

Built with 💪 during my 90-day hard challenge.
