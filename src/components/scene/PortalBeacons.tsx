"use client";

import { Html } from "@react-three/drei";
import type { Vector3Tuple } from "three";
import type { CameraViewId } from "@/config/camera.config";
import { flyToView, type FlightMeta } from "@/components/camera/cameraBus";
import { useFocusState } from "@/lib/focus";
import { usePortalOpen } from "@/lib/portal";

/**
 * Wayfinding. Small beacons float above each portal object — the room's
 * own signage, telling a first-time visitor where everything lives
 * without a map or a menu. They exist only while the camera is idle:
 * the moment a flight starts or a world opens, the signage dissolves
 * and the room is cinema again. Clicking a beacon is the same gesture
 * as the dock — fly there, enter the world.
 */
interface Beacon {
  at: Vector3Tuple;
  label: string;
  view: CameraViewId;
  meta: FlightMeta;
}

const BEACONS: Beacon[] = [
  { at: [0, 1.78, -2.25], label: "Projects", view: "desk", meta: { id: "monitor", name: "Projects" } },
  { at: [3.8, 2.4, 0.5], label: "Experience", view: "whiteboard", meta: { id: "whiteboard", name: "Experience" } },
  { at: [3.2, 2.3, -2.15], label: "Skills", view: "server", meta: { id: "server-rack", name: "Technical Skills" } },
  { at: [-3.68, 2.42, -1.2], label: "Achievements", view: "bookshelf", meta: { id: "bookshelf", name: "Achievements" } },
  { at: [0, 2.62, -3.3], label: "About", view: "window", meta: { id: "window", name: "About" } },
  { at: [-0.62, 1.22, -1.8], label: "Contact", view: "desk", meta: { id: "laptop", name: "Contact" } },
];

export function PortalBeacons() {
  const focus = useFocusState();
  const portalOpen = usePortalOpen();
  const visible = focus.phase === "idle" && !portalOpen;

  return (
    <group>
      {BEACONS.map((b) => (
        <Html
          key={b.label}
          position={b.at}
          center
          // keep beacons UNDER the DOM overlays (dock z-40, portals z-50)
          zIndexRange={[30, 0]}
          style={{ pointerEvents: visible ? "auto" : "none" }}
        >
          <div
            className="flex flex-col items-center transition-opacity duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transitionDelay: visible ? "500ms" : "0ms",
            }}
          >
            <button
              onClick={() => flyToView(b.view, undefined, b.meta)}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-black/45 py-1 pr-3 pl-2 backdrop-blur-md transition-colors hover:border-[#ffb361]/50"
            >
              <span className="beacon-dot h-[5px] w-[5px] rounded-full bg-[#ffb361]" />
              <span className="font-mono text-[10px] tracking-[0.22em] whitespace-nowrap text-[#d9cdb4] uppercase transition-colors group-hover:text-[#ffd9a8]">
                {b.label}
              </span>
            </button>
            {/* stem — pins the sign to its object */}
            <span className="h-5 w-px bg-gradient-to-b from-white/25 to-transparent" />
          </div>
        </Html>
      ))}
    </group>
  );
}
