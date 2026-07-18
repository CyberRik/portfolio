"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Vector3Tuple } from "three";
import { useFocusState } from "@/lib/focus";
import { flyToPose, flyToView, setPortalDepth } from "@/components/camera/cameraBus";
import { CAMERA_VIEWS, type CameraViewId } from "@/config/camera.config";
import { OBJECT_SECTION, type SectionId } from "@/content/portfolio";
import { setPortalOpen } from "@/lib/portal";
import { ProjectsOS } from "./ProjectsOS";
import { ExperienceBoard } from "./ExperienceBoard";
import { SkillsTerminal } from "./SkillsTerminal";
import { AchievementsBook } from "./AchievementsBook";
import { AboutJourney } from "./AboutJourney";
import { ContactCompose } from "./ContactCompose";

/**
 * The room is the hub; every section anchor is a PORTAL. Arriving at
 * one doesn't open a panel — the camera keeps dollying INTO the object
 * while that object's own world takes over the frame:
 *
 *   monitor    → an operating system boots
 *   whiteboard → a career diagram draws itself in marker
 *   server     → an SSH session onto the rack
 *   bookshelf  → a book opens, chapters turn
 *   window     → the night sky becomes a journey constellation
 *   laptop     → a small mail composer, typed live
 *
 * Each world owns its palette, type, motion and pacing. The overlay
 * only decides WHEN worlds open and close and drives the camera dive;
 * everything else is handcrafted per portal.
 */

/** camera dive: push from the section's authored view toward its target */
const PORTAL_PUSH: Record<SectionId, { view: CameraViewId; k: number; dur: number }> = {
  projects: { view: "desk", k: 0.34, dur: 1.2 }, // deep but quick — content first
  experience: { view: "whiteboard", k: 0.52, dur: 1.6 },
  skills: { view: "server", k: 0.5, dur: 1.6 },
  achievements: { view: "bookshelf", k: 0.55, dur: 1.6 },
  about: { view: "window", k: 0.45, dur: 1.9 }, // slow — drift to the glass
  contact: { view: "desk", k: 0.75, dur: 1.3 }, // shallow — stay in the room
};

function pushPose(section: SectionId): { position: Vector3Tuple; target: Vector3Tuple } {
  const { view, k } = PORTAL_PUSH[section];
  const v = CAMERA_VIEWS[view];
  return {
    position: [
      v.target[0] + (v.position[0] - v.target[0]) * k,
      v.target[1] + (v.position[1] - v.target[1]) * k,
      v.target[2] + (v.position[2] - v.target[2]) * k,
    ],
    target: [...v.target] as Vector3Tuple,
  };
}

export function ExperienceOverlay() {
  const focus = useFocusState();
  const [portal, setPortal] = useState<SectionId | null>(null);
  const portalRef = useRef<SectionId | null>(null);
  portalRef.current = portal;

  // arrival at a section anchor opens its portal (after a short beat
  // so the arrival overshoot finishes before the world starts turning)
  useEffect(() => {
    if (focus.phase !== "arrived" || focus.id == null) return;
    const section = OBJECT_SECTION[focus.id];
    if (!section || portalRef.current === section) return;
    const t = setTimeout(() => {
      setPortal(section);
      setPortalOpen(true);
      setPortalDepth(true);
      const pose = pushPose(section);
      flyToPose(pose.position, pose.target, PORTAL_PUSH[section].dur);
    }, 420);
    return () => clearTimeout(t);
  }, [focus.phase, focus.id]);

  const close = useCallback(() => {
    if (!portalRef.current) return;
    setPortal(null);
    setPortalOpen(false);
    setPortalDepth(false);
    flyToView("overview");
  }, []);

  // Esc leaves the world. Listen in capture phase so this fires even
  // though the page-level Esc handler also flies home (harmless: close
  // already requests the same flight).
  useEffect(() => {
    if (!portal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [portal, close]);

  return (
    // wrapper never eats input; each portal root opts back in
    <div className="pointer-events-none absolute inset-0 z-50 [&>*]:pointer-events-auto">
      <AnimatePresence>
        {portal === "projects" && <ProjectsOS key="projects" onClose={close} />}
        {portal === "experience" && <ExperienceBoard key="experience" onClose={close} />}
        {portal === "skills" && <SkillsTerminal key="skills" onClose={close} />}
        {portal === "achievements" && <AchievementsBook key="achievements" onClose={close} />}
        {portal === "about" && <AboutJourney key="about" onClose={close} />}
        {portal === "contact" && <ContactCompose key="contact" onClose={close} />}
      </AnimatePresence>
    </div>
  );
}

export interface PortalProps {
  onClose: () => void;
}
