import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { playlistUrl } = req.query;

  // 타입과 존재 여부 확인
  if (!playlistUrl || typeof playlistUrl !== 'string') {
    return res.status(400).json({ error: 'playlistUrl is required and must be a string' });
  }

  // YouTube Playlist ID 추출
  const url = new URL(playlistUrl);
  const playlistId = url.searchParams.get('list');

  if (!playlistId) {
    return res.status(400).json({ error: 'Invalid playlist URL: missing list parameter' });
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;

    const itemsResponse = await fetch(playlistItemsUrl);
    const itemsData = await itemsResponse.json();

    if (!itemsData.items) {
      return res.status(500).json({ error: 'No items found in playlist' });
    }

    const videoIds = itemsData.items.map((item: any) => item.contentDetails.videoId).join(',');

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
    const videosResponse = await fetch(videosUrl);
    const videosData = await videosResponse.json();

    if (!videosData.items) {
      return res.status(500).json({ error: 'No video details found' });
    }

    // ISO 8601 duration to seconds
    const totalSeconds = videosData.items.reduce((acc: number, video: any) => {
      const duration = video.contentDetails.duration;
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

      if (!match) return acc;

      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);

      return acc + hours * 3600 + minutes * 60 + seconds;
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    res.status(200).json({
      playlistId,
      totalDuration: `${hours}h ${minutes}m ${seconds}s`,
      totalSeconds
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'An error occurred while processing the playlist' });
  }
}