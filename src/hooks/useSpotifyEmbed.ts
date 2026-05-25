"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  embedPreviewEndMs,
  tryApplyVolumeToEmbedHost,
  type SpotifyTrack,
} from "@/lib/spotify";

type WindowWithSpotifyEmbed = Window & {
  __spotifyIframeApi?: SpotifyIframeApi;
};

type UseSpotifyEmbedOptions = {
  onPreviewEnd?: () => void;
};

let iframeApiPromise: Promise<SpotifyIframeApi> | null = null;

function spotifyUriToOpenUrl(uri: string): string | null {
  const match = uri.match(/^spotify:(\w+):(.+)$/);
  if (!match) return null;
  return `https://open.spotify.com/${match[1]}/${match[2]}`;
}

function getIframeApi(): Promise<SpotifyIframeApi> {
  const cached = (window as WindowWithSpotifyEmbed).__spotifyIframeApi;
  if (cached) return Promise.resolve(cached);
  if (iframeApiPromise) return iframeApiPromise;

  iframeApiPromise = new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      (window as WindowWithSpotifyEmbed).__spotifyIframeApi = IFrameAPI;
      resolve(IFrameAPI);
    };

    if (
      !document.querySelector(
        'script[src="https://open.spotify.com/embed/iframe-api/v1"]'
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      script.onerror = () => {
        iframeApiPromise = null;
        reject(new Error("Spotify embed API failed to load"));
      };
      document.body.appendChild(script);
    }
  });

  return iframeApiPromise;
}

function parseOEmbedTitle(title: string): { name: string; artists: string } {
  const byArtist = title.match(/^(.+?),\s*a song by (.+?) on Spotify$/i);
  if (byArtist) {
    return { name: byArtist[1].trim(), artists: byArtist[2].trim() };
  }

  if (title.includes(" · ")) {
    const [name, ...rest] = title.split(" · ");
    const artists = rest
      .join(" · ")
      .replace(/\s*on Spotify$/i, "")
      .trim();
    return { name: name.trim(), artists };
  }

  return {
    name: title.replace(/\s*on Spotify$/i, "").trim(),
    artists: "",
  };
}

async function fetchNowPlaying(uri: string): Promise<SpotifyTrack | null> {
  const openUrl = spotifyUriToOpenUrl(uri);
  if (!openUrl) return null;

  try {
    const res = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(openUrl)}`
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
    };

    const id = openUrl.split("/").pop() ?? "";
    const { name, artists } = parseOEmbedTitle(data.title ?? "Unknown");

    return {
      id,
      uri,
      name,
      artists,
      durationMs: 0,
      previewUrl: null,
      spotifyUrl: openUrl,
      albumImageUrl: data.thumbnail_url ?? null,
    };
  } catch {
    return null;
  }
}

function startEmbedPlayback(controller: SpotifyEmbedController) {
  controller.resume();
  controller.play();
}

export function useSpotifyEmbed(
  playlistUri: string | null,
  options?: UseSpotifyEmbedOptions
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const metadataUriRef = useRef<string | null>(null);
  const onPreviewEndRef = useRef(options?.onPreviewEnd);
  const endedUriRef = useRef<string | null>(null);
  const loadGenerationRef = useRef(0);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<SpotifyTrack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onPreviewEndRef.current = options?.onPreviewEnd;
  });

  const loadMetadataForUri = useCallback((uri: string) => {
    if (metadataUriRef.current === uri) return;
    metadataUriRef.current = uri;
    setPlayingUri(uri);

    void fetchNowPlaying(uri).then((track) => {
      if (metadataUriRef.current !== uri) return;
      if (track) setNowPlaying(track);
    });
  }, []);

  const scheduleAutoplay = useCallback((generation: number) => {
    const run = () => {
      if (loadGenerationRef.current !== generation) return;
      const controller = controllerRef.current;
      if (!controller) return;
      startEmbedPlayback(controller);
    };

    run();
    window.setTimeout(run, 200);
    window.setTimeout(run, 600);
  }, []);

  const playUri = useCallback(
    (uri: string) => {
      const controller = controllerRef.current;
      if (!controller) return;

      loadGenerationRef.current += 1;
      const generation = loadGenerationRef.current;
      endedUriRef.current = null;
      metadataUriRef.current = null;

      controller.loadUri(uri);
      scheduleAutoplay(generation);
    },
    [scheduleAutoplay]
  );

  useEffect(() => {
    if (!playlistUri || !hostRef.current) return;

    let disposed = false;

    getIframeApi()
      .then((IFrameAPI) => {
        if (disposed || !hostRef.current) return;

        IFrameAPI.createController(
          hostRef.current,
          { uri: playlistUri, width: "100%", height: "352" },
          (controller) => {
            if (disposed) return;

            controllerRef.current = controller;
            setIsReady(true);
            tryApplyVolumeToEmbedHost(hostRef.current);
            window.setTimeout(
              () => tryApplyVolumeToEmbedHost(hostRef.current),
              500
            );

            controller.addListener("playback_started", (e) => {
              if (disposed) return;
              const uri = e.data.playingURI;
              if (!uri) return;

              loadMetadataForUri(uri);
              startEmbedPlayback(controller);
            });

            controller.addListener("playback_update", (e) => {
              if (disposed) return;

              setIsPlaying(!e.data.isPaused);
              setProgressMs(e.data.position);
              setDurationMs(e.data.duration);

              const uri = e.data.playingURI;
              if (uri) loadMetadataForUri(uri);

              if (!uri) return;

              const endMs = embedPreviewEndMs(e.data.duration);
              if (e.data.position < endMs * 0.25) {
                if (endedUriRef.current === uri) endedUriRef.current = null;
                return;
              }

              if (
                e.data.position >= endMs - 250 &&
                endedUriRef.current !== uri
              ) {
                endedUriRef.current = uri;
                onPreviewEndRef.current?.();
              }
            });
          }
        );
      })
      .catch(() => {
        if (!disposed) setError("Failed to load player");
      });

    return () => {
      disposed = true;
      controllerRef.current = null;
      metadataUriRef.current = null;
      endedUriRef.current = null;
      setIsReady(false);
      setPlayingUri(null);
      setNowPlaying(null);
    };
  }, [playlistUri, loadMetadataForUri]);

  const togglePlay = useCallback(() => {
    controllerRef.current?.togglePlay();
  }, []);

  return {
    hostRef,
    isReady,
    isPlaying,
    progressMs,
    durationMs,
    playingUri,
    nowPlaying,
    error,
    togglePlay,
    playUri,
  };
}
