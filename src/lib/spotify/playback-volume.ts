export const PLAYBACK_VOLUME = 0.3;

export function applyVolumeToAudioElement(audio: HTMLAudioElement) {
  audio.volume = PLAYBACK_VOLUME;
}

export function tryApplyVolumeToEmbedHost(host: HTMLElement | null) {
  if (!host) return;

  const iframe = host.querySelector("iframe");
  const target = iframe?.contentWindow;
  if (!target) return;

  const percent = Math.round(PLAYBACK_VOLUME * 100);
  const payloads = [
    { command: "setVolume", value: PLAYBACK_VOLUME },
    { command: "setVolume", volume: percent },
    { type: "setVolume", volume: percent },
  ];

  for (const payload of payloads) {
    target.postMessage(payload, "https://open.spotify.com");
  }
}
