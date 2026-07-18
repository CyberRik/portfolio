import * as THREE from "three";
import { palette } from "@/config/theme";
import {
  fabricMap,
  plasterAlbedo,
  plasterRoughness,
  roofPanels,
  walnutAlbedo,
  walnutRoughness,
} from "./textures";

/**
 * Shared material + geometry caches.
 * Every object pulls from here so the whole room resolves to a handful
 * of GPU programs and draw-call-friendly shared resources.
 *
 * Grading intent: warm practicals on cool devices (teal-orange),
 * satin — never glossy, never dead-matte. Roughness maps everywhere
 * it matters; flat roughness is what reads "CG".
 */
const materialCache = new Map<string, THREE.Material>();
const geometryCache = new Map<string, THREE.BufferGeometry>();

function std(
  key: string,
  opts: THREE.MeshStandardMaterialParameters,
): THREE.MeshStandardMaterial {
  let m = materialCache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial(opts);
    materialCache.set(key, m);
  }
  return m;
}

function phys(
  key: string,
  opts: THREE.MeshPhysicalMaterialParameters,
): THREE.MeshPhysicalMaterial {
  let m = materialCache.get(key) as THREE.MeshPhysicalMaterial | undefined;
  if (!m) {
    m = new THREE.MeshPhysicalMaterial(opts);
    materialCache.set(key, m);
  }
  return m;
}

export const materials = {
  get wall() {
    return std("wall", {
      color: palette.wall,
      map: plasterAlbedo(),
      roughnessMap: plasterRoughness(),
      roughness: 0.96,
    });
  },
  get wallAccent() {
    return std("wallAccent", {
      color: palette.wallAccent,
      map: plasterAlbedo(),
      roughnessMap: plasterRoughness(),
      roughness: 0.94,
    });
  },
  get ceiling() {
    return std("ceiling", { color: palette.ceiling, roughness: 1 });
  },
  /** Oiled solid walnut with a satin clearcoat — the hero surface. */
  get deskTop() {
    return phys("deskTop", {
      color: "#a3805c", // deep tint — reads as oiled walnut, not raw pine
      map: walnutAlbedo(),
      roughnessMap: walnutRoughness(),
      roughness: 0.62,
      clearcoat: 0.35,
      clearcoatRoughness: 0.45,
      envMapIntensity: 0.9,
    });
  },
  /** Matte black powder-coated steel. */
  get deskLeg() {
    return std("deskLeg", {
      color: "#161617",
      roughness: 0.58,
      metalness: 0.82,
      envMapIntensity: 0.7,
    });
  },
  // Near-white tints: the walnut map already carries the color —
  // multiplying by a saturated brown reads as mud
  get woodDark() {
    return std("woodDark", {
      color: "#b09a86",
      map: walnutAlbedo(),
      roughness: 0.72,
    });
  },
  get woodLight() {
    return std("woodLight", {
      color: "#ffffff",
      map: walnutAlbedo(),
      roughness: 0.68,
    });
  },
  get metalDark() {
    return std("metalDark", {
      color: palette.metalDark,
      roughness: 0.42,
      metalness: 0.9,
      envMapIntensity: 0.7, // thin frames sparkle (specular aliasing) above this
    });
  },
  /** Powder-coated aluminum — soft wide highlights, no mirror. */
  get metalMid() {
    return std("metalMid", {
      color: palette.metalMid,
      roughness: 0.52,
      metalness: 0.75,
      envMapIntensity: 0.9,
    });
  },
  /** Anodized device shells (monitor, laptop, keyboard case). */
  get deviceBody() {
    return std("deviceBody", {
      color: palette.deviceBody,
      roughness: 0.42,
      metalness: 0.55,
      envMapIntensity: 1.05,
    });
  },
  get keycap() {
    return std("keycap", {
      color: palette.keycap,
      roughness: 0.38,
      envMapIntensity: 0.8,
    });
  },
  get fabric() {
    return std("fabric", {
      color: "#6b6157",
      map: fabricMap(),
      bumpMap: fabricMap(),
      bumpScale: 0.4,
      roughness: 0.85, // faint sheen lets the chair's top edge catch light
    });
  },
  get plantGreen() {
    return std("plantGreen", { color: palette.plantGreen, roughness: 0.75 });
  },
  get plantPot() {
    return std("plantPot", { color: palette.plantPot, roughness: 0.88 });
  },
  /** Glazed ceramic. */
  get mug() {
    return phys("mug", {
      color: palette.mug,
      roughness: 0.18,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.1,
    });
  },
  get whiteboard() {
    return std("whiteboard", {
      color: "#efece4",
      roughness: 0.12,
      metalness: 0.02,
      envMapIntensity: 0.9,
    });
  },
  get paper() {
    return std("paper", { color: "#eae6dd", roughness: 0.9 });
  },
  get glass() {
    let m = materialCache.get("glass") as THREE.MeshPhysicalMaterial | undefined;
    if (!m) {
      m = new THREE.MeshPhysicalMaterial({
        color: "#dceaff",
        roughness: 0.03,
        metalness: 0,
        transmission: 0.94,
        transparent: true,
        opacity: 0.3,
        ior: 1.5,
        envMapIntensity: 1.3,
      });
      materialCache.set("glass", m);
    }
    return m;
  },
  /** Matte rubber for cables. */
  get rubber() {
    return std("rubber", { color: "#121213", roughness: 0.92 });
  },
  /** Near-black matte skin for the diorama's outer shell + plinth.
      Env reflection almost fully suppressed — at glancing angles the
      warm environment was tinting the whole roof slab tan. */
  get shell() {
    return std("shell", {
      color: "#0e0c0a",
      roughness: 0.96,
      metalness: 0,
      envMapIntensity: 0.12,
    });
  },
  /** Rooftop membrane with panel seams. */
  get roof() {
    return std("roof", {
      map: roofPanels(),
      roughness: 0.95,
      metalness: 0,
      envMapIntensity: 0.12,
    });
  },
};

export function sharedBox(): THREE.BoxGeometry {
  let g = geometryCache.get("box") as THREE.BoxGeometry | undefined;
  if (!g) {
    g = new THREE.BoxGeometry(1, 1, 1);
    geometryCache.set("box", g);
  }
  return g;
}

export function sharedCylinder(): THREE.CylinderGeometry {
  let g = geometryCache.get("cylinder") as THREE.CylinderGeometry | undefined;
  if (!g) {
    g = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
    geometryCache.set("cylinder", g);
  }
  return g;
}

/** LED / emissive helpers — cached per color+intensity. */
export function emissive(color: string, intensity = 1): THREE.MeshStandardMaterial {
  return std(`emissive:${color}:${intensity}`, {
    color: "#000000",
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 1,
  });
}
