"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import {
  applyVolumeToAudioElement,
  embedPreviewEndMs,
  formatMs,
  type SpotifyTrack,
} from "@/lib/spotify";
import { useSpotifyEmbed } from "@/hooks/useSpotifyEmbed";

type PlaylistResponse = {
  playlistId?: string;
  playlistUri?: string;
  tracks?: SpotifyTrack[];
  error?: string;
};

export default function MusicContent() {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playlistUri, setPlaylistUri] = useState<string | null>(null);
  const [useAudio, setUseAudio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [broken, setBroken] = useState(false);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(30_000);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tracksRef = useRef(tracks);
  const trackIndexRef = useRef(trackIndex);
  const embedPlayUriRef = useRef<(uri: string) => void>(() => {});

  useEffect(() => {
    tracksRef.current = tracks;
    trackIndexRef.current = trackIndex;
  });

  const goToTrack = useCallback(
    (index: number, embedPlayUri: (uri: string) => void) => {
      const list = tracksRef.current;
      if (!list.length) return;

      const wrapped = ((index % list.length) + list.length) % list.length;
      const track = list[wrapped];
      if (!track) return;

      setTrackIndex(wrapped);
      embedPlayUri(track.uri);
    },
    []
  );

  const handlePreviewEnd = useCallback(() => {
    const next = trackIndexRef.current + 1;
    if (next < tracksRef.current.length) {
      goToTrack(next, embedPlayUriRef.current);
    }
  }, [goToTrack]);

  const {
    hostRef: embedHostRef,
    isReady: embedIsReady,
    isPlaying: embedIsPlaying,
    progressMs: embedProgressMs,
    durationMs: embedDurationMs,
    nowPlaying: embedNowPlaying,
    error: embedError,
    togglePlay: embedTogglePlay,
    playUri: embedPlayUri,
  } = useSpotifyEmbed(useAudio ? null : playlistUri, {
    onPreviewEnd: handlePreviewEnd,
  });

  useEffect(() => {
    embedPlayUriRef.current = embedPlayUri;
  }, [embedPlayUri]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/spotify/playlist");
        const data = (await res.json()) as PlaylistResponse;

        if (cancelled) return;

        if (!res.ok || data.error || !data.tracks?.length) {
          setBroken(true);
          return;
        }

        setTracks(data.tracks);
        setPlaylistUri(data.playlistUri ?? null);
        setUseAudio(
          data.tracks.length > 0 && data.tracks.every((t) => t.previewUrl)
        );
      } catch {
        if (!cancelled) setBroken(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentTrack = tracks[trackIndex] ?? null;

  const displayTrack = useMemo(() => {
    if (useAudio) return currentTrack;
    if (!embedNowPlaying) return currentTrack;

    const fromPlaylist = tracks.find(
      (t) => t.uri === embedNowPlaying.uri || t.id === embedNowPlaying.id
    );

    if (fromPlaylist) {
      return {
        ...fromPlaylist,
        albumImageUrl:
          fromPlaylist.albumImageUrl ?? embedNowPlaying.albumImageUrl,
      };
    }

    return {
      ...embedNowPlaying,
      artists: embedNowPlaying.artists || currentTrack?.artists || "",
    };
  }, [useAudio, currentTrack, embedNowPlaying, tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) applyVolumeToAudioElement(audio);
  }, []);

  useEffect(() => {
    if (!useAudio && embedIsReady) {
      void fetch("/api/spotify/volume", { method: "PUT" }).catch(() => {});
    }
  }, [useAudio, embedIsReady]);

  const playAudioAt = useCallback(
    (index: number) => {
      const track = tracks[index];
      if (!track?.previewUrl) return;

      const audio = audioRef.current;
      if (!audio) return;

      applyVolumeToAudioElement(audio);
      audio.src = track.previewUrl;
      setTrackIndex(index);
      setAudioProgress(0);
      void audio.play().then(() => setAudioPlaying(true));
    },
    [tracks]
  );

  useEffect(() => {
    if (!useAudio) return;
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setAudioProgress(audio.currentTime * 1000);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setAudioDuration(audio.duration * 1000);
      }
    };
    const onEnded = () => {
      const next = trackIndex + 1;
      if (next < tracks.length) playAudioAt(next);
      else setAudioPlaying(false);
    };
    const onPlay = () => setAudioPlaying(true);
    const onPause = () => setAudioPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [useAudio, trackIndex, tracks.length, playAudioAt]);

  const playing = useAudio ? audioPlaying : embedIsPlaying;
  const progress = useAudio ? audioProgress : embedProgressMs;
  const duration = useAudio
    ? audioDuration
    : embedPreviewEndMs(
        embedDurationMs || displayTrack?.durationMs || 0
      );
  const isReady = useAudio || embedIsReady;

  const togglePlay = () => {
    if (useAudio) {
      const audio = audioRef.current;
      if (!audio || !currentTrack) return;
      if (audioPlaying) audio.pause();
      else if (audio.src) void audio.play();
      else playAudioAt(trackIndex);
    } else {
      if (!embedIsPlaying && currentTrack) {
        embedPlayUri(currentTrack.uri);
      } else {
        embedTogglePlay();
      }
    }
  };

  const skip = (delta: number) => {
    if (useAudio) {
      if (!tracks.length) return;
      const next =
        (trackIndex + delta + tracks.length) % tracks.length;
      playAudioAt(next);
      return;
    }

    if (!tracks.length) return;
    const next = trackIndex + delta;
    goToTrack(next, embedPlayUri);
  };

  const showBroken = broken || (!useAudio && !!embedError);
  const progressPercent =
    duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const spotifyHref =
    displayTrack?.spotifyUrl ??
    (playlistUri
      ? `https://open.spotify.com/playlist/${playlistUri.replace("spotify:playlist:", "")}`
      : null);

  return (
    <div className="flex h-full flex-col bg-canvas text-navy">
      <audio ref={audioRef} className="hidden" preload="auto" />

      <div className="flex flex-1 flex-col items-center justify-center border-b border-navy/20 p-6">
        <div className="relative mb-6">
          <div
            className={`flex h-40 w-40 items-center justify-center rounded-full border-[10px] border-navy transition-transform duration-1000 ease-linear ${
              playing ? "animate-[spin_4s_linear_infinite]" : ""
            }`}
            style={{
              boxShadow:
                "inset 0 0 0 2px var(--color-canvas), inset 0 0 0 6px var(--color-navy), inset 0 0 0 10px var(--color-canvas), inset 0 0 0 12px var(--color-navy)",
            }}
          >
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-navy bg-canvas">
              {displayTrack?.albumImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayTrack.albumImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute left-2 top-1 h-full w-full border-t border-navy/20" />
                  <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-navy/20" />
                  <div className="z-10 h-3 w-3 rounded-full bg-navy/80" />
                </>
              )}
            </div>

            <div className="absolute inset-0 m-2 rounded-full border border-dashed border-navy/10" />
            <div className="absolute inset-0 m-6 rounded-full border border-dotted border-navy/10" />
          </div>

          <div
            className={`absolute -right-4 -top-2 h-20 w-4 origin-top-right rounded-full border-2 border-navy bg-canvas transition-transform duration-500 ease-in-out ${
              playing ? "rotate-[25deg]" : "rotate-[5deg]"
            }`}
          />
        </div>

        <div className="text-center font-mono">
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-navy/50">
            {loading ? (
              "LOADING..."
            ) : showBroken ? (
              "UNAVAILABLE"
            ) : playing ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse bg-navy/50" /> NOW
                PLAYING
              </>
            ) : (
              "PAUSED"
            )}
          </div>
          <h2 className="mt-2 text-xl font-bold uppercase tracking-tight sm:text-2xl">
            {loading
              ? "—"
              : showBroken
                ? "Music Player"
                : (displayTrack?.name ?? tracks[0]?.name ?? "—")}
          </h2>
          <div className="mt-1 text-sm font-medium uppercase tracking-widest text-navy/70">
            {loading
              ? "—"
              : showBroken
                ? "Check back soon"
                : (displayTrack?.artists ?? tracks[0]?.artists ?? "—")}
          </div>
          {!showBroken && !loading && (
            <p className="mt-2 text-[9px] tracking-wider text-navy/45">
              Preview · open in Spotify for full track
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-4 bg-navy/5 p-4 sm:px-6">
        <div className="flex items-center gap-3 font-mono text-[10px] text-navy/60">
          <span>{formatMs(progress)}</span>
          <div className="relative h-2 flex-1 border border-navy bg-canvas">
            <div
              className="absolute bottom-0 left-0 top-0 bg-navy transition-all duration-300 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span>{formatMs(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-6 mb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => skip(-1)}
              disabled={loading || showBroken || !isReady}
              className="flex h-8 w-8 items-center justify-center border-2 border-navy border-b-4 border-r-4 bg-canvas text-navy transition-all hover:bg-navy/10 active:translate-x-0.5 active:translate-y-0.5 active:border-b-2 active:border-r-2 disabled:opacity-40"
            >
              <SkipBack size={14} fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              disabled={loading || showBroken || !isReady}
              className="flex h-10 w-10 items-center justify-center border-2 border-navy border-b-4 border-r-4 bg-navy text-canvas transition-all hover:bg-navy/90 active:translate-x-0.5 active:translate-y-0.5 active:border-b-2 active:border-r-2 disabled:opacity-40"
            >
              {playing ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-1" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skip(1)}
              disabled={loading || showBroken || !isReady}
              className="flex h-8 w-8 items-center justify-center border-2 border-navy border-b-4 border-r-4 bg-canvas text-navy transition-all hover:bg-navy/10 active:translate-x-0.5 active:translate-y-0.5 active:border-b-2 active:border-r-2 disabled:opacity-40"
            >
              <SkipForward size={14} fill="currentColor" />
            </button>
          </div>

          {spotifyHref && (
            <a
              href={spotifyHref}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 border-2 border-navy border-b-[3px] border-r-[3px] bg-canvas px-3 py-1.5 font-mono text-[9px] font-bold uppercase transition-all hover:bg-navy hover:text-canvas active:translate-x-0.5 active:translate-y-0.5 active:border-b-2 active:border-r-2"
            >
              Spotify
            </a>
          )}
        </div>

        {!useAudio && playlistUri && !showBroken && (
          <div
            className="h-0 w-full overflow-hidden"
            style={{ clipPath: "inset(100%)" }}
            aria-hidden
          >
            <div ref={embedHostRef} className="h-20 w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
