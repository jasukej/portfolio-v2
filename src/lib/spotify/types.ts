export type SpotifyTrack = {
  id: string;
  uri: string;
  name: string;
  artists: string;
  durationMs: number;
  previewUrl: string | null;
  spotifyUrl: string;
  albumImageUrl: string | null;
};

export function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
