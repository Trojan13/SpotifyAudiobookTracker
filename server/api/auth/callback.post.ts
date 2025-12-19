export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  
  const { code } = body;

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'No authorization code provided'
    })
  }

  try {
    const credentials = `${config.spotifyClientId}:${config.spotifyClientSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.spotifyRedirectUri
    });
    console.log('[SERVER] Request params:', params.toString());

    const tokenResponse = await $fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`
      },
      body: params.toString()
    });

    const accessToken = (tokenResponse as any).access_token;

    setCookie(event, 'spotify_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/'
    });

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
