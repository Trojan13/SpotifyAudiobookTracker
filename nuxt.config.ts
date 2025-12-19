export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  
  devServer: {
    host: '127.0.0.1',
    port: 3000
  },
  
  runtimeConfig: {
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI,
    public: {
      spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
      spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI,
    }
  },

  nitro: {
    preset: 'netlify'
  },

  css: ['~/assets/css/main.css']
})
