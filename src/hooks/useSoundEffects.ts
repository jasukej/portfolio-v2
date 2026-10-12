import { useEffect } from "react";
import { useWindowStore } from "@/store/useWindowStore";

const SOUNDS = {
  startup: "/effects/StartupEMate300.wav",
  click: "/effects/Single-Click.wav",
} as const;

type Sound = keyof typeof SOUNDS;

// Same elements cursors.css gives the pointer cursor.
const CLICKABLE = 'a, button, select, [role="button"], summary, label, .cursor-pointer';

let context: AudioContext | null = null;
const buffers = new Map<Sound, Promise<AudioBuffer>>();

function getContext() {
  context ??= new AudioContext();
  return context;
}

/** Fetch and decode once; decoding works before the context is allowed to play. */
function load(sound: Sound) {
  let buffer = buffers.get(sound);
  if (!buffer) {
    buffer = fetch(SOUNDS[sound])
      .then((res) => res.arrayBuffer())
      .then((data) => getContext().decodeAudioData(data));
    buffers.set(sound, buffer);
  }
  return buffer;
}

async function play(sound: Sound) {
  // Read at play time so toggling in Settings applies immediately.
  if (!useWindowStore.getState().soundEffects) return;
  const ctx = getContext();
  const source = ctx.createBufferSource();
  source.buffer = await load(sound);
  source.connect(ctx.destination);
  source.start();
}

/**
 * Plays the startup chime once `booted` flips, and a click on every clickable
 * element, unless sound effects are off in Settings. Browsers keep audio
 * suspended until the visitor interacts, so if the chime is blocked at boot it
 * plays on their first click or key press.
 */
export function useSoundEffects(booted: boolean) {
  useEffect(() => {
    void load("startup");
    void load("click");
  }, []);

  useEffect(() => {
    if (!booted) return;

    const ctx = getContext();
    let startupPending = true;

    const playStartup = () => {
      startupPending = false;
      void play("startup");
    };

    void ctx.resume();
    if (ctx.state === "running") playStartup();

    const handlePointerDown = (e: PointerEvent) => {
      void ctx.resume().then(() => {
        if (startupPending) return playStartup();
        const target = (e.target as Element).closest(CLICKABLE);
        if (target && !target.matches(":disabled")) void play("click");
      });
    };

    const handleKeyDown = () => {
      if (startupPending) void ctx.resume().then(playStartup);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [booted]);
}
