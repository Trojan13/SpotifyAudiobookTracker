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
    });
    console.log('[CALLBACK] Response:', response);
    
    console.log('[CALLBACK] Redirecting to home page');
    await navigateTo('/');
  } catch (e: any) {
    console.error('[CALLBACK] Error:', e);
    console.error('[CALLBACK] Error data:', e.data);
    error.value = e.data?.message || e.message || 'Authentication failed. Please try again.';
  }
});
</script>
