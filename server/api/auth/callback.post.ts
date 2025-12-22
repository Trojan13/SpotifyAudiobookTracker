export default defineEventHandler(async (event) => {
  console.log('[AUTH] Callback handler started');
  const config = useRuntimeConfig();
  const body = await readBody(event);
  
  const { code } = body;
  console.log('[AUTH] Received authorization code:', code ? 'Present' : 'Missing');

  if (!code) {
    console.error('[AUTH] No authorization code provided');
    throw createError({
      statusCode: 400,
      message: 'No authorization code provided'
    })
  }

  try {
    console.log('[AUTH] Starting token exchange...');
    const credentials = `${config.spotifyClientId}:${config.spotifyClientSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.spotifyRedirectUri
    });
    console.log('[AUTH] Token exchange params ready, redirect_uri:', config.spotifyRedirectUri);

    const tokenResponse = await $fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`
      },
      body: params.toString()
    });

    console.log('[AUTH] Token exchange successful');
    const accessToken = (tokenResponse as any).access_token;
    console.log('[AUTH] Access token received, length:', accessToken?.length || 0);
    console.log('[AUTH] Access token received, length:', accessToken?.length || 0);

    console.log('[AUTH] Fetching user profile to check premium status...');
    const userProfile = await $fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }).catch((err) => {
      console.error('[AUTH] Failed to fetch user profile:', err);
      throw createError({
        statusCode: 500,
        message: 'Failed to verify user account'
      });
    });

    const userProduct = (userProfile as any).product;
    const userName = (userProfile as any).display_name;
    const userEmail = (userProfile as any).email;
    console.log('[AUTH] User profile retrieved:', { userName, userEmail, product: userProduct });
    
    if (userProduct === 'free') {
      console.log('[AUTH] User is free tier, denying access');
      return { 
        success: false, 
        premiumRequired: true 
      };
    }

    console.log('[AUTH] User has premium, setting cookies...');
    setCookie(event, 'spotify_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/'
    });

    // Set a separate cookie that JavaScript can read to check login state
    setCookie(event, 'spotify_logged_in', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/'
    });

    console.log('[AUTH] Cookies set successfully, authentication complete');
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
