export default defineEventHandler(async (event) => {
  console.log('[SERVER] Callback endpoint called');
  
  const config = useRuntimeConfig();
  console.log('[SERVER] Client ID:', config.spotifyClientId);
  console.log('[SERVER] Redirect URI:', config.spotifyRedirectUri);
  
  const body = await readBody(event);
  console.log('[SERVER] Request body:', body);
  
  const { code } = body;

  if (!code) {
    console.error('[SERVER] No code provided');
    throw createError({
      statusCode: 400,
      message: 'No authorization code provided'
    })
  }

  console.log('[SERVER] Code received, length:', code.length);

  try {
    const credentials = `${config.spotifyClientId}:${config.spotifyClientSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    console.log('[SERVER] Credentials encoded');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.spotifyRedirectUri
    });
    console.log('[SERVER] Request params:', params.toString());

    console.log('[SERVER] Calling Spotify token endpoint...');
    const tokenResponse = await $fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`
      },
      body: params.toString()
    });

    console.log('[SERVER] Token response received');
    const accessToken = (tokenResponse as any).access_token;
    console.log('[SERVER] Access token:', accessToken ? 'Present' : 'Missing');

    setCookie(event, 'spotify_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/'
    });

    console.log('[SERVER] Cookie set successfully');
    return { success: true }
  } catch (error: any) {
    console.error('[SERVER] Token exchange error:', error);
    console.error('[SERVER] Error status:', error.status);
    console.error('[SERVER] Error data:', error.data);
    throw createError({
      statusCode: 401,
      message: error.data?.error_description || error.message || 'Failed to exchange code for token'
    })
  }
})
