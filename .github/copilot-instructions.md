# AudioBookTrack - Nuxt 3 Spotify Audiobook Tracker

## Project Overview
Netlify-hosted Nuxt 3 application for tracking Spotify audiobook progress.

## Tech Stack
- Nuxt 3.17.7 with Nitro 2.12.9
- Spotify Web API (Recently Played endpoint)
- OAuth 2.0 Authentication
- Pure CSS (no Bootstrap, minimalistic design)
- TypeScript support

## Spotify App Configuration
- Client ID: (stored in .env)
- Client Secret: (stored in .env)
- Redirect URI (Dev): http://127.0.0.1:8000/callback
- Required Scopes: user-read-recently-played, user-read-playback-state

## Features Implemented
- ✅ Spotify OAuth 2.0 authentication
- ✅ Fetch recently played tracks (last 50)
- ✅ Audiobook detection using multiple heuristics
- ✅ Filter between all tracks and audiobooks only
- ✅ Minimalistic dark UI (no emojis)
- ✅ Netlify deployment configuration
- ✅ Session management with HTTP-only cookies

## Audiobook Detection Strategy
The app identifies audiobooks using:
1. Album type checking (album_type === 'audiobook')
2. Track type checking (type === 'episode')
3. Show media type (for podcasts/audiobooks)
4. Keyword matching in album names: "audiobook", "narrated by", "unabridged", "abridged"

## Project Structure
```
├── assets/css/main.css           # Global styles (minimalistic dark theme)
├── pages/
│   ├── index.vue                 # Main app page
│   └── callback.vue              # OAuth callback handler
├── server/api/
│   ├── auth/callback.post.ts     # OAuth token exchange
│   └── recent-tracks.get.ts      # Fetch & process tracks
├── nuxt.config.ts                # Nuxt config with Netlify preset
├── netlify.toml                  # Netlify deployment config
└── README.md                     # Full documentation

```

## Development
```bash
npm install
npm run dev -- --port 8000
```
App runs at http://localhost:8000

## Deployment to Netlify
1. Push to GitHub
2. Connect to Netlify
3. Set environment variables in Netlify:
   - SPOTIFY_CLIENT_ID
   - SPOTIFY_CLIENT_SECRET
   - SPOTIFY_REDIRECT_URI (update to production URL)
4. Update Spotify Developer Dashboard with production redirect URI

## Development Progress
- [x] Create copilot-instructions.md file
- [x] Scaffold Nuxt 3 project
- [x] Configure Spotify OAuth integration
- [x] Create audiobook tracking features
- [x] Design minimalistic UI
- [x] Configure Netlify deployment
- [x] Install dependencies and test
- [x] Update documentation
