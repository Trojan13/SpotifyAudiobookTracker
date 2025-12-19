<template>
  <div class="container">
    <div class="header">
      <h1>AudioBookTrack</h1>
      <p>Track your Spotify audiobook progress</p>
    </div>
    
    <div class="premium-required-page">
      <div class="premium-icon">🎵</div>
      <h2>Spotify Premium Required</h2>
      <p class="main-message">
        This app requires a Spotify Premium subscription to access your listening history and audiobook progress.
      </p>
      
      <div class="features-box">
        <h3>Why Premium?</h3>
        <ul>
          <li>Access to your recently played tracks</li>
          <li>Current playback information</li>
          <li>Detailed audiobook progress tracking</li>
          <li>Full API access to your listening data</li>
        </ul>
      </div>

      <div class="actions">
        <a href="https://www.spotify.com/premium/" target="_blank" class="btn btn-primary">
          Upgrade to Premium
        </a>
        <NuxtLink to="/" class="btn btn-secondary">
          Back to Home
        </NuxtLink>
      </div>
      
      <p class="note">
        Already have Premium? Try logging out and back in, or check your subscription status.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// This page is shown when a user doesn't have Spotify Premium
</script>

<style scoped>
.premium-required-page {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.premium-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.main-message {
  font-size: 1.1rem;
  margin: 1.5rem 0;
  color: #b3b3b3;
  line-height: 1.6;
}

.features-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: left;
}

.features-box h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #1db954;
}

.features-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-box li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.features-box li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #1db954;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.note {
  font-size: 0.9rem;
  color: #888;
  margin-top: 2rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .premium-required-page {
    padding: 1rem;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .actions .btn {
    width: 100%;
  }
}
</style>
