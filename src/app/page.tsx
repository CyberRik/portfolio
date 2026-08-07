"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { flyToView } from "@/components/camera/cameraBus";
import { PROFILE } from "@/content/portfolio";
import { isExitKey } from "@/lib/keys";
import { getPortalSection } from "@/lib/portal";
import { AmbientAudio } from "@/components/ui/AmbientAudio";

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

const OnboardingHint = dynamic(
  () => import("@/components/ui/OnboardingHint").then((m) => m.OnboardingHint),
  { ssr: false },
);

export default function Home() {
  // any key returns to the wide shot — the "back out" gesture. Same rule
  // as the portal worlds use, so backing out feels identical whether or
  // not a world is open (see lib/keys.ts for what "any" excludes).
  //
  // While a world IS open, closePortal owns the exit and stages its own
  // flight. Firing this one too meant a single keypress started two gsap
  // timelines that killed each other mid-move, which is how the camera
  // ended up parked somewhere between the two poses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isExitKey(e)) return;
      if (getPortalSection() !== null) return;
      flyToView("overview");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#1c1915]">
      <SceneCanvas />
      <LoadingScreen />
      <ViewDock />

      <FocusCaption />
      <ExperienceOverlay />
      <OnboardingHint />

      {/* Top bar: the quiet identity chip, and the 20-second answers —
          résumé and a way to reach me, always one tap away, no exploring
          required.

          ONE flex row rather than two independently anchored corners.
          Anchoring them separately (top-6 left-6 / top-6 right-6) is
          fine at desktop widths and collides on every phone: at 390px
          the identity block and the link row are each wider than half
          the screen, so they overlapped into unreadable mush. Laying
          them out as a single justify-between row makes that collision
          structurally impossible at any width instead of merely tuned
          away at the widths someone happened to test. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
        <div className="select-none">
          <p className="font-mono text-[9px] tracking-[0.22em] text-[#a89880] uppercase sm:text-[11px] sm:tracking-[0.35em]">
            Ritankar Mondal
          </p>
          <p className="mt-1 font-mono text-[8.5px] tracking-[0.14em] text-[#6b6152] sm:text-[10px] sm:tracking-[0.2em]">
            AI Engineer · IIT Madras
          </p>
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-3 font-mono text-[9px] tracking-[0.14em] uppercase sm:gap-5 sm:text-[10px] sm:tracking-[0.2em]">
          <AmbientAudio />
          <a
            href={PROFILE.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#a89880] transition-colors hover:text-[#ffd9a8]"
          >
            resume ↓
          </a>
          <a
            href={`mailto:${PROFILE.email}`}
            className="text-[#a89880] transition-colors hover:text-[#ffd9a8]"
          >
            say hello ↗
          </a>
        </div>
      </div>
    </main>
  );
}
