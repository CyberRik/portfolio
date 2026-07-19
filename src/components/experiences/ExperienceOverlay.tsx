"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useFocusState } from "@/lib/focus";
import { closePortal, openPortal, usePortalSection } from "@/lib/portal";
import { OBJECT_SECTION } from "@/content/portfolio";
import { isExitKey } from "@/lib/keys";
import { ExperienceBoard } from "./ExperienceBoard";
import { SkillsTerminal } from "./SkillsTerminal";
import { AchievementsBook } from "./AchievementsBook";
import { AboutJourney } from "./AboutJourney";
import { ContactCompose } from "./ContactCompose";

/**
 * The room is the hub; every section anchor is a PORTAL. Arriving at
 * one doesn't open a panel — the camera keeps dollying INTO the object
 * while that object's own world takes over:
 *
 *   monitor    → RM-OS renders ON the physical screen (in-scene,
 *                MonitorScreen.tsx — the room never leaves the frame)
 *   whiteboard → a career diagram draws itself in marker
 *   server     → an SSH session onto the rack
 *   bookshelf  → a book opens, chapters turn
 *   window     → the night sky becomes a journey constellation
 *   laptop     → a small mail composer, typed live
 *
 * This overlay renders the fullscreen DOM worlds and owns the open/
 * close choreography; the shared portal store (lib/portal.ts) stages
 * the camera and lets in-scene worlds participate too.
 */
export function ExperienceOverlay() {
  const focus = useFocusState();
  const section = usePortalSection();

  // arrival at a section anchor opens its portal (after a short beat
  // so the arrival overshoot finishes before the world starts turning)
  useEffect(() => {
    if (focus.phase !== "arrived" || focus.id == null) return;
    const target = OBJECT_SECTION[focus.id];
    if (!target) return;
    const t = setTimeout(() => openPortal(target), 420);
    return () => clearTimeout(t);
  }, [focus.phase, focus.id]);

  // any key leaves the world (capture phase — the page-level handler
  // also flies home, which is the same flight close() requests)
  useEffect(() => {
    if (!section) return;
    const onKey = (e: KeyboardEvent) => {
      if (isExitKey(e)) closePortal();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [section]);

  return (
    // wrapper never eats input; each portal root opts back in.
    // "projects" has no DOM world here — it lives on the monitor.
    <div className="pointer-events-none absolute inset-0 z-50 [&>*]:pointer-events-auto">
      <AnimatePresence>
        {section === "experience" && <ExperienceBoard key="experience" onClose={closePortal} />}
        {section === "skills" && <SkillsTerminal key="skills" onClose={closePortal} />}
        {section === "achievements" && <AchievementsBook key="achievements" onClose={closePortal} />}
        {section === "about" && <AboutJourney key="about" onClose={closePortal} />}
        {section === "contact" && <ContactCompose key="contact" onClose={closePortal} />}
      </AnimatePresence>
    </div>
  );
}

export interface PortalProps {
  onClose: () => void;
}
