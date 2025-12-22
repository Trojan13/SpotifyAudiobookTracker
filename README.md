# AudioResume - Continue Your Spotify Audiobooks

A sleek Nuxt 3 application that helps you seamlessly resume your Spotify audiobooks with intelligent detection and progress tracking.

## Features

- 🎧 Track recently played Spotify tracks
- 📚 Intelligent audiobook detection (German + English)
- 🎯 Filter: All tracks, Audiobooks, or Grouped view
- 📊 Confidence scoring for detection accuracy
- 📖 Group audiobooks by series/album
- ⚡ Minimalistic, fast interface
- 🔒 Secure OAuth 2.0 with server-side tokens

## Tech Stack

- Nuxt 3.17.7 with Nitro 2.12.9
- Spotify Web API (Recently Played endpoint)
- OAuth 2.0 Authorization Code Flow
- Pure CSS (minimalistic dark theme)
- Netlify deployment ready

## Local Development

### Prerequisites

- Node.js 20.x or higher
- A Spotify account
- Spotify Developer App credentials

### Setup

1. **Clone and Install**

```bash
npm install
```

2. **Configure Spotify App**

Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and:
- Create a new app or use existing
- Note your Client ID and Client Secret
- Add redirect URI: `http://127.0.0.1:3000/callback`

3. **Run Development Server**

```bash
npm run dev
```

The app will be available at `http://127.0.0.1:3000`

## Deploy to Netlify

### Quick Deploy

1. **Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Connect to Netlify**

- Go to [Netlify](https://app.netlify.com)
- Click "New site from Git"
- Select your repository
- Netlify will auto-detect Nuxt settings

3. **Configure Environment Variables**

In Netlify Dashboard → Site settings → Environment variables, add:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-site.netlify.app/callback
```

4. **Update Spotify Redirect URI**

- Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- Add your Netlify URL: `https://your-site.netlify.app/callback`

5. **Deploy**

Netlify will automatically build and deploy your site!

### Manual Deploy via CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set SPOTIFY_CLIENT_ID your_spotify_client_id
netlify env:set SPOTIFY_CLIENT_SECRET your_spotify_client_secret
netlify env:set SPOTIFY_REDIRECT_URI https://your-site.netlify.app/callback
netlify deploy --prod
```

## How It Works

### Audiobook Detection Algorithm

The app uses a sophisticated scoring system to identify audiobooks:

**Detection Criteria:**
1. **Explicit indicators** - album_type, episode type, media_type
2. **Keywords** (German + English)
   - Hörbuch, ungekürzt, gelesen von
   - audiobook, narrated by, unabridged
3. **Chapter patterns** - Kapitel 1, Chapter 1, Teil 1
4. **Author/narrator markers** - (Autor), (Erzähler), (Narrator)
5. **Track duration** - 10-60 minutes typical for audiobooks
6. **Track count** - Audiobooks usually have 5+ tracks
7. **Publishers** - Audible, Lübbe Audio, Der Hörverlag
8. **Name similarity** - Track vs album name patterns

**Scoring:** Tracks with score ≥ 30 are classified as audiobooks

### Views

1. **All Tracks** - Complete listening history
2. **Audiobooks** - Filtered list of detected audiobooks
3. **Grouped** - Audiobooks organized by series with:
   - Book cover and metadata
   - Chapters played
   - Detection confidence
   - Last played timestamp

## Project Structure

```
├── assets/css/main.css         # Minimalistic dark theme
├── pages/
│   ├── index.vue              # Main app (tracks + grouping)
│   └── callback.vue           # OAuth handler
├── server/api/
│   ├── auth/callback.post.ts  # Token exchange
│   └── recent-tracks.get.ts   # Fetch & detect audiobooks
├── nuxt.config.ts             # Nuxt config (Netlify preset)
├── netlify.toml               # Netlify deployment
└── package.json
```

## API Endpoints

- `POST /api/auth/callback` - Exchange OAuth code for access token
- `GET /api/recent-tracks` - Fetch recently played tracks with audiobook detection

## Security

- ✅ Authorization Code Flow (not deprecated Implicit Grant)
- ✅ Server-side token exchange
- ✅ HTTP-only cookies
- ✅ Client secret never exposed to browser
- ✅ Loopback redirect URI (127.0.0.1)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SPOTIFY_CLIENT_ID` | Your Spotify app client ID | Yes |
| `SPOTIFY_CLIENT_SECRET` | Your Spotify app client secret | Yes |
| `SPOTIFY_REDIRECT_URI` | OAuth callback URL | Yes |

## License

MIT
