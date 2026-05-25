import { NextResponse } from "next/server";
import { getAccessToken, PLAYBACK_VOLUME } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function PUT() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const volumePercent = Math.round(PLAYBACK_VOLUME * 100);

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (response.status === 204 || response.ok) {
    return NextResponse.json({ volumePercent });
  }

  return NextResponse.json({ error: "volume_failed" }, { status: response.status });
}
