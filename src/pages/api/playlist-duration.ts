import type { NextApiRequest, NextApiResponse } from 'next';

interface PlaylistItem {
  contentDetails: {
    videoId: string;
  };
}

interface VideoItem {
  contentDetails: {
    duration: string;
  };
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  playlistId: string;
  totalDuration: string;
  totalSeconds: number;
}

type Data = SuccessResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { playlistUrl } = req.query;

  if (!playlistUrl || typeof playlistUrl !== 'string') {
    return res
      .status(400)
      .json({ error: 'playlistUrl is required and must be a string' });
  }

  try {
    const url = new URL(playlistUrl);
    const playlistId = url.searchParams.get('list');

    if (!playlistId) {
      return res
        .status(400)
        .json({ error: 'Invalid playlist URL: missing list parameter' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error('YOUTUBE_API_KEY is missing from environment variables');
      return res
        .status(500)
        .json({ error: 'YouTube API key is not configured' });
    }

    // Fetch playlist items
    const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
    const itemsResponse = await fetch(playlistItemsUrl);

    if (!itemsResponse.ok) {
      return res
        .status(500)
        .json({ error: 'Failed to fetch playlist items' });
    }

    const itemsData = await itemsResponse.json();

    if (!itemsData.items || !Array.isArray(itemsData.items)) {
      return res
        .status(500)
        .json({ error: 'No items found in playlist' });
    }

    const items: PlaylistItem[] = itemsData.items;
    const videoIds = items.map(item => item.contentDetails.videoId).join(',');

    if (!videoIds) {
      return res
        .status(500)
        .json({ error: 'No video IDs found in playlist' });
    }

    // Fetch video details
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
    const videosResponse = await fetch(videosUrl);

    if (!videosResponse.ok) {
      return res
        .status(500)
        .json({ error: 'Failed to fetch video details' });
    }

    const videosData = await videosResponse.json();

    if (!videosData.items || !Array.isArray(videosData.items)) {
      return res
        .status(500)
        .json({ error: 'No video details found' });
    }

    const videos: VideoItem[] = videosData.items;

    // Helper function to parse ISO 8601 duration to seconds
    function parseDuration(duration: string): number {
      const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
      const matches = duration.match(regex);
      if (!matches) return 0;
      const hours = matches[1] ? parseInt(matches[1], 10) : 0;
      const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
      const seconds = matches[3] ? parseInt(matches[3], 10) : 0;
      return hours * 3600 + minutes * 60 + seconds;
    }

    const totalSeconds = videos.reduce((acc, video) => {
      return acc + parseDuration(video.contentDetails.duration);
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return res.status(200).json({
      playlistId,
      totalDuration: `${hours}h ${minutes}m ${seconds}s`,
      totalSeconds,
    });
  } catch (error) {
    console.error('Error processing playlist:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while processing the playlist' });
  }
}
