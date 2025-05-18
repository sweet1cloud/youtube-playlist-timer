// pages/index.tsx
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>YouTube Playlist Timer</title>
        <meta name="description" content="Calculate total duration of a YouTube playlist" />
      </Head>
      <main>
        <h1>플레이리스트 총 재생시간 계산기</h1>
        {/* 여기에 플레이리스트 주소 입력 폼과 계산 버튼 등 UI 구현 */}
      </main>
    </>
  );
}