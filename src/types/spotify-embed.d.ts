type SpotifyEmbedPlaybackUpdate = {
  data: {
    isPaused: boolean;
    position: number;
    duration: number;
    playingURI?: string;
  };
};

type SpotifyEmbedController = {
  loadUri: (
    uri: string,
    preferVideo?: boolean,
    startAt?: number,
    theme?: string
  ) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  restart: () => void;
  seek: (seconds: number) => void;
  destroy: () => void;
  addListener: (
    event: "ready" | "playback_started" | "playback_update",
    callback: (payload: SpotifyEmbedPlaybackUpdate) => void
  ) => void;
};

type SpotifyIframeApi = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string; height?: string },
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
};

interface Window {
  onSpotifyIframeApiReady?: (IFrameAPI: SpotifyIframeApi) => void;
}
