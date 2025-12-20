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
        <p class="premium-note">Spotify Premium required</p>
      </div>
    </div>

    <div v-else>
      <div v-if="loading" class="loading">
        Loading your audiobook progress...
      </div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div v-else>
        <div v-if="lastAudiobook" class="current-audiobook">
          <h2>Continue Your Audiobook</h2>
          <div class="audiobook-card-large">
            <img 
              v-if="lastAudiobook.track.album?.images?.[0]?.url" 
              :src="lastAudiobook.track.album.images[0].url" 
              :alt="lastAudiobook.track.name"
              class="audiobook-cover"
            >
            <div v-else class="audiobook-cover"></div>
            
            <div class="audiobook-info">
              <h3>{{ lastAudiobook.track.name }}</h3>
              <p class="author">{{ getArtists(lastAudiobook.track) }}</p>
              <p class="album">{{ lastAudiobook.track.album?.name }}</p>
              <p class="last-played">Last played {{ formatDate(lastAudiobook.played_at) }}</p>

              <div class="audiobook-actions">
                <a :href="lastAudiobook.track.external_urls?.spotify" target="_blank" class="btn btn-primary">
                  Continue Listening
                </a>
                <span class="badge audiobook">{{ Math.round(lastAudiobook.audiobookConfidence) }}% confidence</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentAudiobook && currentAudiobook.isPlaying" class="now-playing-badge">
          <h3>Now Playing</h3>
          <div class="track-card">
            <div class="track-header">
              <img 
                v-if="currentAudiobook.track.album?.images?.[0]?.url" 
                :src="currentAudiobook.track.album.images[0].url" 
                :alt="currentAudiobook.track.name"
                class="track-image"
              >
              <div v-else class="track-image"></div>
              
              <div class="track-info">
                <div class="track-title">{{ currentAudiobook.track.name }}</div>
                <div class="track-author">{{ getArtists(currentAudiobook.track) }}</div>
                
                <div v-if="currentAudiobook.progressMs" class="playback-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                  </div>
                  <div class="progress-time">
                    {{ formatDuration(currentAudiobook.progressMs) }} / {{ formatDuration(currentAudiobook.track.duration_ms) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <details class="history-section">
          <summary>
            <h2>Listening History</h2>
          </summary>

          <div class="history-controls">
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
            </div>

            <div class="limit-selector">
              <label>Tracks to load:</label>
              <select v-model="trackLimit" @change="fetchRecentTracks">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="30">30</option>
                <option :value="50">50</option>
              </select>
            </div>
          </div>

          <div v-if="filteredTracks.length === 0 && viewMode === 'list'" class="empty-state">
            <p>No tracks found</p>
          </div>

          <div v-else-if="viewMode === 'grouped'">
            <div v-if="groupedAudiobooks.length === 0" class="empty-state">
              <p>No audiobooks found</p>
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
        </details>

        <div class="logout-section">
          <button class="btn-secondary btn" @click="logout">Logout</button>
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
const currentAudiobook = ref<any>(null)
const lastAudiobook = ref<any>(null)
const tracks = ref<any[]>([])
const groupedAudiobooks = ref<any[]>([])
const stats = ref<any>({})
const trackLimit = ref(20)
const filter = ref('all')
const viewMode = ref('list')

const progressPercent = computed(() => {
  if (!currentAudiobook.value?.progressMs || !currentAudiobook.value?.track?.duration_ms) return 0
  return (currentAudiobook.value.progressMs / currentAudiobook.value.track.duration_ms) * 100
})

const loginUrl = computed(() => {
  const scopes = 'user-read-recently-played user-read-playback-state user-read-currently-playing'
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

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
  
  const hadSession = document.cookie.includes('spotify_logged_in=true')
  
  try {
    const response = await $fetch(`/api/recent-tracks?limit=${trackLimit.value}`) as any
    
    if (response.currentlyPlaying && response.currentlyPlaying.isAudiobook) {
      currentAudiobook.value = response.currentlyPlaying
    } else {
      currentAudiobook.value = null
    }
    
    const audiobooks = response.items?.filter((item: any) => item.isAudiobook) || []
    if (audiobooks.length > 0) {
      lastAudiobook.value = audiobooks[0]
    }
    
    tracks.value = response.items || []
    groupedAudiobooks.value = response.grouped || []
    stats.value = response.stats || {}
  } catch (e: any) {
    if (e.statusCode === 401) {
      isLoggedIn.value = false
      if (hadSession && isLoggedIn.value) {
        sessionExpired.value = true
        error.value = 'Your session has expired. Please log in again.'
      }
      document.cookie = 'spotify_access_token=; Max-Age=0; path=/'
      document.cookie = 'spotify_logged_in=; Max-Age=0; path=/'
    } else {
      error.value = e.message || 'Failed to fetch tracks'
    }
  } finally {
    loading.value = false
  }
}

const logout = () => {
  // Clear the session cookies
  document.cookie = 'spotify_access_token=; Max-Age=0; path=/'
  document.cookie = 'spotify_logged_in=; Max-Age=0; path=/'
  isLoggedIn.value = false
  tracks.value = []
}

onMounted(async () => {
  // Check if user has a valid session cookie (check the readable cookie)
  const hasSessionCookie = document.cookie.includes('spotify_logged_in=true')
  
  if (!hasSessionCookie) {
    isLoggedIn.value = false
    return
  }
  
  // If cookie exists, try to fetch data
  try {
    await fetchRecentTracks()
    isLoggedIn.value = true
  } catch (e: any) {
    // If fetch fails with 401, session is expired
    if (e.statusCode === 401) {
      isLoggedIn.value = false
      sessionExpired.value = true
      document.cookie = 'spotify_access_token=; Max-Age=0; path=/'
      document.cookie = 'spotify_logged_in=; Max-Age=0; path=/'
    } else {
      isLoggedIn.value = false
    }
  }
})
</script>
