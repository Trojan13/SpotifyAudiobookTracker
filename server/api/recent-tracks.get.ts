function detectAudiobook(item: any): { isAudiobook: boolean; confidence: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const track = item.track;
  
  if (track?.album?.album_type === 'audiobook') {
    score += 100;
    reasons.push('Explicit audiobook type');
  }
  
  if (track?.type === 'episode') {
    score += 50;
    reasons.push('Episode type (podcast/audiobook)');
  }
  
  if (track?.show?.media_type === 'audio') {
    score += 40;
    reasons.push('Audio media type');
  }

  const albumName = (track?.album?.name || track?.show?.name || '').toLowerCase();
  const audioBookKeywords = [
    'hörbuch', 'hoerbuch', 'hörspiel', 'ungekürzt', 'gekürzt', 
    'vorgelesen von', 'gelesen von', 'erzählt von',
    'audiobook', 'audio book', 'narrated by', 'read by',
    'unabridged', 'abridged', 'narrator'
  ];
  
  const foundKeywords = audioBookKeywords.filter(keyword => albumName.includes(keyword));
  if (foundKeywords.length > 0) {
    score += foundKeywords.length * 20;
    reasons.push(`Keywords: ${foundKeywords.join(', ')}`);
  }

  const trackName = (track?.name || '').toLowerCase();
  const chapterPatterns = [
    /kapitel\s*\d+/i,
    /chapter\s*\d+/i,
    /teil\s*\d+/i,
    /part\s*\d+/i,
    /track\s*\d+/i,
    /\d+\s*-\s*\d+/,
  ];
  
  const matchedPatterns = chapterPatterns.filter(pattern => pattern.test(trackName));
  if (matchedPatterns.length > 0) {
    score += 25;
    reasons.push('Chapter/part pattern in track name');
  }

  const artistName = (track?.artists?.[0]?.name || track?.show?.publisher || '').toLowerCase();
  const authorPatterns = [
    /\(autor\)/i,
    /\(author\)/i,
    /\(erzähler\)/i,
    /\(narrator\)/i,
    /verschiedene sprecher/i,
    /various narrators/i
  ];
  
  const matchedAuthorPatterns = authorPatterns.filter(pattern => pattern.test(artistName));
  if (matchedAuthorPatterns.length > 0) {
    score += 15;
    reasons.push('Author/narrator indicator in artist name');
  }

  const durationMs = track?.duration_ms || 0;
  const durationMinutes = durationMs / 60000;
  
  if (durationMinutes >= 10 && durationMinutes <= 60) {
    score += 15;
    reasons.push(`Long track duration: ${Math.round(durationMinutes)}min`);
  } else if (durationMinutes > 60) {
    score += 10;
    reasons.push(`Very long track: ${Math.round(durationMinutes)}min`);
  }

  const totalTracks = track?.album?.total_tracks || track?.show?.total_episodes || 0;
  if (totalTracks >= 10) {
    score += 10;
    reasons.push(`Many tracks: ${totalTracks}`);
  } else if (totalTracks >= 5) {
    score += 5;
    reasons.push(`Multiple tracks: ${totalTracks}`);
  }

  const label = (track?.album?.label || '').toLowerCase();
  const audioPublishers = [
    'hörbuch', 'hoerbuch', 'audiobook', 'audible', 'lübbe audio',
    'der hörverlag', 'argon', 'randomhouse audio', 'penguin random house'
  ];
  
  const foundPublishers = audioPublishers.filter(pub => label.includes(pub));
  if (foundPublishers.length > 0) {
    score += 30;
    reasons.push(`Audiobook publisher: ${label}`);
  }

  const nameSimilarity = trackName.length > 0 && albumName.length > 0 && 
    (trackName.includes(albumName.substring(0, Math.min(20, albumName.length))) ||
     albumName.includes(trackName.substring(0, Math.min(20, trackName.length))));
  
  if (nameSimilarity && totalTracks > 1) {
    score += 5;
    reasons.push('Track name similar to album/show name');
  }

  const isAudiobook = score >= 30;
  const confidence = Math.min(100, score);

  return { isAudiobook, confidence, reasons };
}

export default defineEventHandler(async (event) => {
  const accessToken = getCookie(event, 'spotify_access_token')
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 50, 50)

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated'
    })
  }

  try {
    const [recentTracksData, currentPlayback] = await Promise.allSettled([
      $fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }),
      $fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
    ])

    const items = (recentTracksData.status === 'fulfilled' ? (recentTracksData.value as any) : { items: [] }).items || []

    let currentlyPlaying = null
    if (currentPlayback.status === 'fulfilled' && currentPlayback.value) {
      const current = currentPlayback.value as any
      if (current.item) {
        const detection = detectAudiobook({ track: current.item, played_at: new Date().toISOString() })
        currentlyPlaying = {
          track: current.item,
          isPlaying: current.is_playing,
          progressMs: current.progress_ms,
          isAudiobook: detection.isAudiobook,
          confidence: detection.confidence
        }
      }
    }

    const processedItems = items.map((item: any) => {
      const detection = detectAudiobook(item);
      
      if (process.env.NODE_ENV !== 'production' && detection.isAudiobook) {
        console.log('[AUDIOBOOK DETECTED]', {
          track: item.track?.name,
          album: item.track?.album?.name || item.track?.show?.name,
          confidence: detection.confidence,
          reasons: detection.reasons
        });
      }

      const albumId = item.track?.album?.id || item.track?.show?.id || 'unknown';
      const albumName = item.track?.album?.name || item.track?.show?.name || 'Unknown';

      return {
        ...item,
        isAudiobook: detection.isAudiobook,
        audiobookConfidence: detection.confidence,
        detectionReasons: detection.reasons,
        groupId: albumId,
        groupName: albumName
      }
    });

    const audiobooks = processedItems.filter((item: any) => item.isAudiobook);
    const groupedAudiobooks = audiobooks.reduce((acc: any, item: any) => {
      const groupId = item.groupId;
      if (!acc[groupId]) {
        acc[groupId] = {
          id: groupId,
          name: item.groupName,
          author: item.track?.artists?.[0]?.name || item.track?.show?.publisher || 'Unknown',
          image: item.track?.album?.images?.[0]?.url || item.track?.show?.images?.[0]?.url,
          totalTracks: item.track?.album?.total_tracks || item.track?.show?.total_episodes || 0,
          tracks: [],
          lastPlayed: item.played_at,
          confidence: item.audiobookConfidence
        };
      }
      acc[groupId].tracks.push({
        name: item.track?.name,
        played_at: item.played_at,
        duration_ms: item.track?.duration_ms,
        track_number: item.track?.track_number
      });
      if (new Date(item.played_at) > new Date(acc[groupId].lastPlayed)) {
        acc[groupId].lastPlayed = item.played_at;
      }
      return acc;
    }, {});

    const groupedArray = Object.values(groupedAudiobooks).sort((a: any, b: any) => 
      new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()
    );

    return {
      currentlyPlaying,
      items: processedItems,
      grouped: groupedArray,
      stats: {
        total: processedItems.length,
        audiobooks: audiobooks.length,
        music: processedItems.length - audiobooks.length,
        uniqueAudiobooks: groupedArray.length
      }
    }
  } catch (error: any) {
    if (error.statusCode === 401) {
      throw createError({
        statusCode: 401,
        message: 'Session expired, please login again'
      })
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch recent tracks'
    })
  }
})
