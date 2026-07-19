"use client";

import { createContext, useContext } from "react";
import type { MilestoneId, ProjectId } from "@/content/work";

/**
 * The wiring that makes RM-OS feel like one machine rather than a set
 * of unrelated windows.
 *
 * Timeline → a milestone names its projects → clicking one opens the
 * project workspace. A project names its milestone → clicking it jumps
 * back into the Timeline with that chapter expanded. A project names
 * related projects → those open in place. Every app gets these through
 * context so nothing has to drill props through the desktop.
 */
export interface OSRoutes {
  /** open the Projects app and load a project's workspace */
  openProject: (id: ProjectId) => void;
  /** open the Timeline app with a chapter expanded */
  openMilestone: (id: MilestoneId) => void;
  /** raise a dock app by id */
  openApp: (id: string) => void;
}

const noop = () => {};

export const OSRouterContext = createContext<OSRoutes>({
  openProject: noop,
  openMilestone: noop,
  openApp: noop,
});

export const useOSRouter = () => useContext(OSRouterContext);
