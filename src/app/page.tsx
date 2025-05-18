/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'

export default function Home() {
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [endTime, setEndTime] = useState('')
  const [duration, setDuration] = useState('')
  const [error, setError] = useState('')

  const handleCheck = async () => {
    try {
      setError('')
      const response = await fetch(`/api/playlist-duration?playlistUrl=${encodeURIComponent(playlistUrl)}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      const now = new Date()
      const end = new Date(now.getTime() + data.totalSeconds * 1000)
      const formattedEnd = end.toLocaleTimeString()

      setDuration(data.totalDuration)
      setEndTime(formattedEnd)
    } catch (_err) {
      setError('재생시간 계산 중 오류가 발생했습니다.')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <title>YouTube Playlist Timer</title>
      <h1 className="text-3xl font-bold mb-4 text-gray-900">YouTube Playlist Timer</h1>
      <p className="mb-6 text-gray-700 max-w-md text-center">
        유튜브 재생목록 URL을 입력하고, 재생시간을 계산해보세요.
      </p>
      <input
        type="text"
        value={playlistUrl}
        onChange={(e) => setPlaylistUrl(e.target.value)}
        placeholder="YouTube 재생목록 URL 붙여넣기"
        className="p-2 border border-gray-300 rounded w-full max-w-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
      <button
        onClick={handleCheck}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        재생시간 계산
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {duration && (
        <div className="mt-6 text-center text-gray-800">
          <p>총 재생시간: <strong>{duration}</strong></p>
          <p>지금 시작하면 <strong>{endTime}</strong>에 끝나요 ⏰</p>
        </div>
      )}
    </main>
  )
}
