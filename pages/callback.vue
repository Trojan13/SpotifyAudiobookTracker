<template>
  <div class="container">
    <div v-if="error" class="error">
      {{ error }}
      <br />
      <br />
      <NuxtLink to="/" class="btn">Go Home</NuxtLink>
    </div>
    <div v-else class="loading">
      <p>Authenticating with Spotify...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const error = ref('');

onMounted(async () => {
  console.log('[CALLBACK] Page loaded');
  console.log('[CALLBACK] Route query:', route.query);
  
  const code = route.query.code as string;
  console.log('[CALLBACK] Code:', code ? 'Present' : 'Missing');
  
  if (!code) {
    console.error('[CALLBACK] No code in query params');
    error.value = 'No authorization code received';
    return;
  }
  
  try {
    console.log('[CALLBACK] Posting code to /api/auth/callback');
    const response = await $fetch('/api/auth/callback', {
      method: 'POST',
      body: { code }
    }) as any;
    console.log('[CALLBACK] Response:', response);
    
    if (response && response.premiumRequired) {
      console.log('[CALLBACK] Premium required, redirecting');
      await navigateTo('/premium-required');
      return;
    }
    
    if (response && response.success) {
      console.log('[CALLBACK] Authentication successful, redirecting to home');
      await new Promise(resolve => setTimeout(resolve, 500));
      await navigateTo('/');
    } else {
      throw new Error('Invalid response from authentication server');
    }
  } catch (e: any) {
    console.error('[CALLBACK] Error:', e);
    console.error('[CALLBACK] Error data:', e.data);
    
    if (e.statusCode === 500) {
      error.value = 'Failed to verify your Spotify account. Please try again.';
    } else if (e.statusCode === 401) {
      error.value = 'Authentication failed. The authorization code may have expired.';
    } else {
      error.value = e.data?.message || e.message || 'Authentication failed. Please try again.';
    }
  }
});
</script>
