import type { SpotifyTrack } from "./types";

const TOKEN_URL = "https://accounts.spotify.com/api/token";

type SpotifyTrackPayload = {
  uri: string;
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  external_urls: { spotify: string };
  artists: { name: string }[];
  album: { images: { url: string }[] };
};

type SpotifyPlaylistRow = {
  track?: SpotifyTrackPayload | null;
  item?: (SpotifyTrackPayload & { type?: string }) | null;
};

type SpotifyPlaylistResponse = {
  items: SpotifyPlaylistRow[];
  next: string | null;
};

export function getRedirectUri(requestUrl?: string): string {
  const configured = process.env.SPOTIFY_REDIRECT_URI;
  if (configured) return configured;

  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT ?? "3000";
    return `http://127.0.0.1:${port}/api/spotify/callback`;
  }

  if (requestUrl) {
    const origin = new URL(requestUrl).origin;
    return `${origin}/api/spotify/callback`;
  }

  throw new Error("SPOTIFY_REDIRECT_URI must be set in production");
}

export async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
}

function mapPlaylistItem(row: SpotifyPlaylistRow): SpotifyTrack | null {
  const track =
    row.item?.type === "track" || row.item?.id ? row.item : row.track;
  if (!track?.id) return null;

  return {
    id: track.id,
    uri: track.uri,
    name: track.name,
    artists: track.artists.map((a) => a.name).join(", "),
    durationMs: track.duration_ms,
    previewUrl: track.preview_url,
    spotifyUrl: track.external_urls.spotify,
    albumImageUrl: track.album.images[0]?.url ?? null,
  };
}

export class SpotifyPlaylistError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function fetchPlaylistPage(
  accessToken: string,
  url: string
): Promise<SpotifyPlaylistResponse> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new SpotifyPlaylistError(
      response.status,
      "Could not load playlist tracks."
    );
  }

  return response.json() as Promise<SpotifyPlaylistResponse>;
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=50&market=from_token`;

  try {
    while (url) {
      const page = await fetchPlaylistPage(accessToken, url);

      for (const row of page.items) {
        const mapped = mapPlaylistItem(row);
        if (mapped) tracks.push(mapped);
      }

      url = page.next;
    }
  } catch (err) {
    if (!(err instanceof SpotifyPlaylistError) || err.status !== 403) {
      throw err;
    }

    url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
    while (url) {
      const page = await fetchPlaylistPage(accessToken, url);
      for (const row of page.items) {
        const mapped = mapPlaylistItem(row);
        if (mapped) tracks.push(mapped);
      }
      url = page.next;
    }
  }

  return tracks;
}
