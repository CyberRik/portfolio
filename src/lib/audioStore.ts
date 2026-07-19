import { useEffect, useState } from "react";

export type Track = {
  src: string;
  name: string;
  artist: string;
};

export const TRACKS: Track[] = [
  {
    src: "/audio/lukrembo - marshmallow.mp3",
    name: "lukrembo - marshmallow.mp3",
    artist: "lukrembo - marshmallow",
  },
  {
    src: "/audio/forgotten-path.mp3",
    name: "forgotten_path.mp3",
    artist: "johndekale · CC0",
  },
  {
    src: "/audio/menu-theme.mp3",
    name: "menu_theme.mp3",
    artist: "CodeManu · CC-BY 3.0",
  },
  {
    src: "/audio/chip-drive.mp3",
    name: "chip_drive.mp3",
    artist: "CodeManu · CC-BY 3.0",
  },
];

class AudioPlayer {
  audio: HTMLAudioElement | null = null;
  state = {
    idx: 0,
    playing: false,
    muted: false,
    progress: 0,
    len: 0,
  };
  listeners = new Set<(s: typeof this.state) => void>();

  constructor() {
    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.preload = "none";

      this.audio.addEventListener("loadedmetadata", () => {
        this.updateState({ len: this.audio!.duration });
      });
      this.audio.addEventListener("timeupdate", () => {
        this.updateState({ progress: this.audio!.currentTime });
      });
      this.audio.addEventListener("pause", () => {
        this.updateState({ playing: false });
      });
      this.audio.addEventListener("play", () => {
        this.updateState({ playing: true });
      });
      this.audio.addEventListener("volumechange", () => {
        this.updateState({ muted: this.audio!.muted });
      });
    }
  }

  updateState(partial: Partial<typeof this.state>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  }

  subscribe(l: (s: typeof this.state) => void) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  playTrack(idx: number) {
    if (!this.audio) return;
    if (idx !== this.state.idx || !this.audio.src) {
      this.audio.src = TRACKS[idx].src;
      this.updateState({ idx, progress: 0, len: 0 });
    }
    this.audio.volume = 0.55;
    this.audio.play().catch(() => this.updateState({ playing: false }));
  }

  togglePlay() {
    if (!this.audio) return;
    if (this.state.playing) {
      this.audio.pause();
    } else {
      if (!this.audio.src) this.audio.src = TRACKS[this.state.idx].src;
      this.audio.volume = 0.55;
      this.audio.play().catch(() => this.updateState({ playing: false }));
    }
  }

  setMuted(muted: boolean) {
    if (!this.audio) return;
    this.audio.muted = muted;
  }

  seek(fraction: number) {
    if (!this.audio || !Number.isFinite(this.audio.duration)) return;
    this.audio.currentTime = fraction * this.audio.duration;
  }
}

export const audioPlayer = new AudioPlayer();

export function useAudioPlayer() {
  const [state, setState] = useState(audioPlayer.state);
  useEffect(() => audioPlayer.subscribe(setState), []);
  return state;
}
