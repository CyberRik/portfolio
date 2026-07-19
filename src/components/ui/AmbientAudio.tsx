"use client";

import { audioPlayer, useAudioPlayer, TRACKS } from "@/lib/audioStore";

export function AmbientAudio() {
  const { playing, idx } = useAudioPlayer();
  const track = TRACKS[idx];
  
  // Format track name to just the base name without extension
  const trackName = track.name.replace(".mp3", "");
  const trackInfo = `${trackName} • ${track.artist}`;

  return (
    <div className="flex items-center">
      <button
        onClick={() => audioPlayer.togglePlay()}
        className="flex items-center gap-2 overflow-hidden rounded-full border border-[#a89880]/30 bg-black/20 px-3 py-1.5 text-[#a89880] transition-colors hover:border-[#ffd9a8]/50 hover:text-[#ffd9a8] w-48"
        aria-label={playing ? "Pause background music" : "Play background music"}
      >
        <span className="shrink-0">{playing ? "🔈" : "🔇"}</span>
        {playing ? (
          <div className="flex-1 overflow-hidden relative" style={{ maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)" }}>
            <div className="animate-marquee hover:[animation-play-state:paused]">
              <span className="pr-8">{trackInfo}</span>
              <span className="pr-8">{trackInfo}</span>
            </div>
          </div>
        ) : (
          <span className="text-[10px] tracking-widest text-[#a89880]/70 uppercase">Audio</span>
        )}
      </button>
    </div>
  );
}
