"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { flyToView } from "@/components/camera/cameraBus";
import { PROFILE } from "@/content/portfolio";

// The entire 3D world and its DOM UI overlays are client-only and code-split away from the shell.
const SceneCanvas = dynamic(
  () => import("@/components/canvas/SceneCanvas").then((m) => m.SceneCanvas),
  { ssr: false },
);

const LoadingScreen = dynamic(
  () => import("@/components/ui/LoadingScreen").then((m) => m.LoadingScreen),
  { ssr: false },
);

const ViewDock = dynamic(
  () => import("@/components/ui/ViewDock").then((m) => m.ViewDock),
  { ssr: false },
);

const ItemLabel = dynamic(
  () => import("@/components/ui/ItemLabel").then((m) => m.ItemLabel),
  { ssr: false },
);

const FocusCaption = dynamic(
  () => import("@/components/ui/FocusCaption").then((m) => m.FocusCaption),
  { ssr: false },
);

const ExperienceOverlay = dynamic(
  () =>
    import("@/components/experiences/ExperienceOverlay").then(
      (m) => m.ExperienceOverlay,
    ),
  { ssr: false },
);

export default function Home() {
  // Esc always returns to the wide shot — the "back out" gesture
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") flyToView("overview");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#1c1915]">
      <SceneCanvas />
      <LoadingScreen />
      <ViewDock />
      <ItemLabel />
      <FocusCaption />
      <ExperienceOverlay />

      {/* Quiet identity chip */}
      <div className="pointer-events-none absolute top-6 left-6 z-40 select-none">
        <p className="font-mono text-[11px] tracking-[0.35em] text-[#a89880] uppercase">
          Ritankar Mondal
        </p>
        <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-[#6b6152]">
          AI Engineer · IIT Madras
        </p>
      </div>

      {/* The 20-second answers — résumé and a way to reach me, always
          one click away, no exploring required */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-5 font-mono text-[10px] tracking-[0.2em] uppercase">
        <a
          href={PROFILE.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#a89880] transition-colors hover:text-[#ffd9a8]"
        >
          résumé ↓
        </a>
        <a
          href={`mailto:${PROFILE.email}`}
          className="text-[#a89880] transition-colors hover:text-[#ffd9a8]"
        >
          say hello ↗
        </a>
      </div>
    </main>
  );
}
