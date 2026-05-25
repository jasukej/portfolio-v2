import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedirectUri } from "@/lib/spotify";

export const dynamic = "force-dynamic";

const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-modify-playback-state",
  "user-read-playback-state",
].join(" ");

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "SPOTIFY_CLIENT_ID is not set in .env.local" },
      { status: 500 }
    );
  }

  const redirectUri = getRedirectUri(request.url);
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set("spotify_auth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
    show_dialog: "true",
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
