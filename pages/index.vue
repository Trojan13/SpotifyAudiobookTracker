<template>
  <div class="container">
    <div class="header">
      <h1>AudioBookTrack</h1>
      <p>Track your Spotify audiobook progress</p>
    </div>
    
    <div v-if="!isLoggedIn">
      <div v-if="sessionExpired" class="error">
        <h2>Session Expired</h2>
        <p>Your Spotify session has expired. Please reconnect to continue tracking your audiobooks.</p>
        <br>
        <a :href="loginUrl" class="btn">Reconnect Spotify</a>
      </div>
      <div v-else class="empty-state">
        <h2>Welcome</h2>
        <p>Connect your Spotify account to start tracking your audiobooks</p>
        <br>
        <a :href="loginUrl" class="btn">Connect Spotify</a>
      </div>
    </div>

    <div v-else>
      <div class="filters">
        <button 
          :class="['filter-btn', { active: filter === 'all' }]"
          @click="filter = 'all'; viewMode = 'list'"
        >
          All Tracks ({{ stats.total || 0 }})
        </button>
        <button 
          :class="['filter-btn', { active: filter === 'audiobooks' && viewMode === 'list' }]"
          @click="filter = 'audiobooks'; viewMode = 'list'"
        >
          Audiobooks ({{ stats.audiobooks || 0 }})
        </button>
        <button 
          :class="['filter-btn', { active: viewMode === 'grouped' }]"
          @click="filter = 'audiobooks'; viewMode = 'grouped'"
        >
          Grouped ({{ stats.uniqueAudiobooks || 0 }})
        </button>
        <button class="btn-secondary btn" @click="logout">Logout</button>
      </div>

      <div v-if="premiumRequired" class="error">
        <h2>Spotify Premium Required</h2>
        <p>This app requires Spotify Premium to access your recently played tracks.</p>
        <p>Please upgrade your account at <a href="https://www.spotify.com/premium/" target="_blank" style="color: #1db954;">spotify.com/premium</a></p>
      </div>

      <div v-if="loading" class="loading">
        Loading your recent tracks...
      </div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div v-else-if="filteredTracks.length === 0 && viewMode === 'list'" class="empty-state">
        <h2>No tracks found</h2>
        <p>Start listening to audiobooks on Spotify!</p>
      </div>

      <div v-else-if="viewMode === 'grouped'">
        <div v-if="groupedAudiobooks.length === 0" class="empty-state">
          <h2>No audiobooks found</h2>
          <p>Start listening to audiobooks on Spotify!</p>
        </div>

        <div v-for="group in groupedAudiobooks" :key="group.id" class="audiobook-group">
          <div class="track-header">
            <img 
              v-if="group.image" 
              :src="group.image" 
              :alt="group.name"
              class="track-image"
            >
            <div v-else class="track-image"></div>
            
            <div class="track-info">
              <div class="track-title">{{ group.name }}</div>
              <div class="track-author">{{ group.author }}</div>
              <div class="track-album">{{ group.totalTracks }} tracks • Last played {{ formatDate(group.lastPlayed) }}</div>
            </div>
          </div>

          <div class="group-details">
            <div class="group-stats">
              <span class="badge audiobook">Audiobook</span>
              <span class="badge">{{ group.tracks.length }} played</span>
              <span class="badge">{{ Math.round(group.confidence) }}% confidence</span>
            </div>
            
            <div class="recent-tracks">
              <h4>Recently played chapters:</h4>
              <ul>
                <li v-for="(track, idx) in group.tracks.slice(0, 5)" :key="idx">
                  <span class="chapter-name">{{ track.name }}</span>
                  <span class="chapter-time">{{ formatDate(track.played_at) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div v-for="item in filteredTracks" :key="item.played_at" class="track-card">
          <div class="track-header">
            <img 
              v-if="item.track.album?.images?.[0]?.url" 
              :src="item.track.album.images[0].url" 
              :alt="item.track.name"
              class="track-image"
            >
            <div v-else class="track-image"></div>
            
            <div class="track-info">
              <div class="track-title">{{ item.track.name }}</div>
              <div class="track-author">{{ getArtists(item.track) }}</div>
              <div class="track-album">{{ item.track.album?.name || 'Unknown Album' }}</div>
            </div>
          </div>

          <div class="track-meta">
            <span class="track-time">{{ formatDate(item.played_at) }}</span>
            <span :class="['badge', { audiobook: item.isAudiobook }]">
              {{ item.isAudiobook ? 'Audiobook' : 'Music' }}
            </span>
          </div>

          <div v-if="item.track.duration_ms" class="progress-bar">
            <div class="progress-fill" :style="{ width: '0%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()

const isLoggedIn = ref(false)
const loading = ref(false)
const error = ref('')
const sessionExpired = ref(false)
const premiumRequired = ref(false)
const tracks = ref<any[]>([])
const groupedAudiobooks = ref<any[]>([])
const stats = ref<any>({})
const filter = ref('all')
const viewMode = ref('list') // 'list' or 'grouped'

const loginUrl = computed(() => {
  const scopes = 'user-read-recently-played user-read-playback-state'
  const params = new URLSearchParams({
    client_id: config.public.spotifyClientId,
    response_type: 'code',
    redirect_uri: config.public.spotifyRedirectUri,
    scope: scopes,
  })
  return `https://accounts.spotify.com/authorize?${params.toString()}`
})

const filteredTracks = computed(() => {
  if (filter.value === 'audiobooks') {
    return tracks.value.filter(item => item.isAudiobook)
  }
  return tracks.value
})

const getArtists = (track: any) => {
  return track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return date.toLocaleDateString()
}

const fetchRecentTracks = async () => {
  loading.value = true
  error.value = ''
  sessionExpired.value = false
  premiumRequired.value = false
  
  try {
    const response = await $fetch('/api/recent-tracks')
    
    if (response && response.premiumRequired === true) {
      premiumRequired.value = true
      isLoggedIn.value = false
      return
    }
    
    tracks.value = response.items || []
    groupedAudiobooks.value = response.grouped || []
    stats.value = response.stats || {}
  } catch (e: any) {
    if (e.statusCode === 401) {
      isLoggedIn.value = false
      sessionExpired.value = true
      error.value = 'Your session has expired. Please log in again.'
      document.cookie = 'spotify_access_token=; Max-Age=0; path=/'
    } else {
      error.value = e.message || 'Failed to fetch tracks'
    }
  } finally {
    loading.value = false
  }
}

const logout = () => {
  // Clear the session cookie
  document.cookie = 'spotify_access_token=; Max-Age=0; path=/'
  isLoggedIn.value = false
  tracks.value = []
}

onMounted(async () => {
  // Try to fetch tracks - if we get a 401, we're not logged in
  try {
    await fetchRecentTracks();
    isLoggedIn.value = true;
  } catch (e: any) {
    if (e.statusCode === 401) {
      isLoggedIn.value = false;
    }
  }
})
</script>
