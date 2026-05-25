import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({
      isPlaying: false,
      message: "Missing Spotify credentials",
    });
  }

  try {
    const nowPlayingResponse = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );

    if (nowPlayingResponse.status === 204 || nowPlayingResponse.status > 400) {
      return NextResponse.json({ isPlaying: false });
    }

    const song = await nowPlayingResponse.json();

    if (!song.item) {
      return NextResponse.json({ isPlaying: false });
    }

    return NextResponse.json({
      isPlaying: song.is_playing,
      title: song.item.name,
      artist: song.item.artists
        .map((a: { name: string }) => a.name)
        .join(", "),
      albumImageUrl: song.item.album.images[0]?.url,
      songUrl: song.item.external_urls.spotify,
      progressMs: song.progress_ms,
      durationMs: song.item.duration_ms,
    });
  } catch {
    return NextResponse.json({
      isPlaying: false,
      message: "Server error fetching Spotify",
    });
  }
}
