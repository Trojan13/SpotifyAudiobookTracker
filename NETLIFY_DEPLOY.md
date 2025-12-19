# Netlify Deployment Guide

## Prerequisites
- GitHub account
- Netlify account (free tier works)
- Spotify Developer App configured

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
git init
git add .
git commit -m "Initial commit - AudioBookTrack"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Connect to Netlify

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Authorize Netlify to access your GitHub
5. Select your repository

### 3. Configure Build Settings

Netlify will auto-detect the settings from `netlify.toml`, but verify:

- **Build command:** `npm run build`
- **Publish directory:** `.output/public`
- **Functions directory:** `.output/server`

Click "Deploy site"

### 4. Configure Environment Variables

After initial deploy (it will fail without env vars):

1. Go to Site settings → Environment variables
2. Add the following variables:

```
SPOTIFY_CLIENT_ID = your_spotify_client_id
SPOTIFY_CLIENT_SECRET = your_spotify_client_secret
SPOTIFY_REDIRECT_URI = https://YOUR-SITE-NAME.netlify.app/callback
```

**Important:** Replace `YOUR-SITE-NAME` with your actual Netlify subdomain

### 5. Update Spotify Developer App

1. Go to https://developer.spotify.com/dashboard
2. Select your app (AudioBookTrack)
3. Click "Settings"
4. Under "Redirect URIs", add:
   ```
   https://YOUR-SITE-NAME.netlify.app/callback
   ```
5. Click "Save"

### 6. Redeploy

1. In Netlify dashboard, go to "Deploys"
2. Click "Trigger deploy" → "Deploy site"
3. Wait for build to complete

### 7. Test Your Deployment

1. Visit `https://YOUR-SITE-NAME.netlify.app`
2. Click "Connect Spotify"
3. Authorize the app
4. You should see your recently played tracks!

## Custom Domain (Optional)

### Add Custom Domain

1. In Netlify: Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `audiobooks.yourdomain.com`)
4. Follow DNS configuration instructions

### Update Environment Variables

```
SPOTIFY_REDIRECT_URI = https://audiobooks.yourdomain.com/callback
```

### Update Spotify Developer App

Add your custom domain to Redirect URIs:
```
https://audiobooks.yourdomain.com/callback
```

## Troubleshooting

### Build Fails

**Check logs in Netlify deploy tab**

Common issues:
- Missing environment variables
- Node version mismatch (should be 20.19.0)

### Authentication Fails

**Verify:**
- `SPOTIFY_REDIRECT_URI` matches exactly in:
  - Netlify env variables
  - Spotify Developer Dashboard
- No trailing slashes
- HTTPS (not HTTP) for production

### 401 Errors

**Token expired** - This is normal after 1 hour. Users need to reconnect.

To check cookies are being set:
1. Open browser DevTools → Application → Cookies
2. Look for `spotify_access_token`
3. Should be httpOnly, Secure (in production)

## Monitoring

### Netlify Analytics (Optional)

Enable in: Site settings → Analytics

### Function Logs

View in: Functions → Select function → Logs

## Updates

To deploy changes:

```bash
git add .
git commit -m "Your update message"
git push
```

Netlify will automatically rebuild and deploy!

## Environment Variables Reference

| Variable | Value | Location |
|----------|-------|----------|
| `SPOTIFY_CLIENT_ID` | `your_spotify_client_id` | Netlify |
| `SPOTIFY_CLIENT_SECRET` | `your_spotify_client_secret` | Netlify |
| `SPOTIFY_REDIRECT_URI` | `https://YOUR-SITE.netlify.app/callback` | Netlify + Spotify Dev |

## Security Notes

- ✅ Never commit `.env` file
- ✅ Client secret is server-side only
- ✅ HTTP-only cookies prevent XSS
- ✅ HTTPS enforced in production
- ✅ Authorization Code Flow (secure)
