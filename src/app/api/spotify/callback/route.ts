import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedirectUri } from "@/lib/spotify";

export const dynamic = "force-dynamic";

function setupPage(title: string, body: string, status = 200) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: ui-monospace, monospace; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    code, pre { background: #f4f4f4; padding: 0.15rem 0.35rem; border-radius: 4px; word-break: break-all; }
    pre { padding: 1rem; overflow-x: auto; }
    h1 { font-size: 1.25rem; }
    ol { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${body}
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (error) {
    return setupPage(
      "Spotify authorization failed",
      `<p>Spotify returned: <code>${error}</code></p>
       <p><a href="/api/spotify/auth">Try again</a></p>`,
      400
    );
  }

  if (!code || !state) {
    return setupPage(
      "Invalid callback",
      "<p>Missing authorization code. <a href=\"/api/spotify/auth\">Start over</a></p>",
      400
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("spotify_auth_state")?.value;
  cookieStore.delete("spotify_auth_state");

  if (!storedState || storedState !== state) {
    return setupPage(
      "Invalid state",
      "<p>CSRF check failed. <a href=\"/api/spotify/auth\">Try again</a></p>",
      400
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return setupPage(
      "Missing credentials",
      "<p>Set <code>SPOTIFY_CLIENT_ID</code> and <code>SPOTIFY_CLIENT_SECRET</code> in <code>.env.local</code>.</p>",
      500
    );
  }

  const redirectUri = getRedirectUri(request.url);
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = (await tokenResponse.json()) as {
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenResponse.ok || !tokenData.refresh_token) {
    const detail =
      tokenData.error_description ?? tokenData.error ?? "Unknown error";
    return setupPage(
      "Token exchange failed",
      `<p>${detail}</p>
       <p>Ensure your Spotify app redirect URI matches exactly (use loopback IP, not localhost):</p>
       <pre>${redirectUri}</pre>
       <p>Add to <code>.env.local</code>: <code>SPOTIFY_REDIRECT_URI=${redirectUri}</code></p>
       <p><a href="/api/spotify/auth">Try again</a></p>`,
      500
    );
  }

  return setupPage(
    "Spotify connected",
    `<p>Copy this refresh token into <code>.env.local</code>:</p>
     <pre>SPOTIFY_REFRESH_TOKEN=${tokenData.refresh_token}</pre>
     <p>Then add your playlist ID (from the Spotify share link):</p>
     <pre>SPOTIFY_PLAYLIST_ID=your_playlist_id</pre>
     <ol>
       <li>Restart <code>npm run dev</code></li>
       <li>Make your playlist <strong>public</strong> in Spotify for the embed player</li>
       <li>Visitors play music in their browser — your Spotify app stays untouched</li>
     </ol>
     <p><a href="/">Back to portfolio</a></p>`
  );
}
