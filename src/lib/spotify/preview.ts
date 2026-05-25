export const SPOTIFY_EMBED_PREVIEW_MS = 30_000;

export function embedPreviewEndMs(reportedDurationMs: number): number {
  if (reportedDurationMs > 0 && reportedDurationMs <= SPOTIFY_EMBED_PREVIEW_MS + 2000) {
    return reportedDurationMs;
  }
  return Math.min(
    reportedDurationMs > 0 ? reportedDurationMs : SPOTIFY_EMBED_PREVIEW_MS,
    SPOTIFY_EMBED_PREVIEW_MS
  );
}

export function isEmbedPreviewFinished(
  positionMs: number,
  reportedDurationMs: number
): boolean {
  const endMs = embedPreviewEndMs(reportedDurationMs);
  if (endMs < 1000) return false;
  return positionMs >= endMs - 200;
}
