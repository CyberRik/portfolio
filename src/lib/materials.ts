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
 * Grading intent: warm practicals on cool devices (teal-orange), and
 * deliberately FLAT. Metalness and clearcoat are the two strongest
 * photoreal cues in this renderer — a sharp specular lobe is the thing
 * that makes a viewer read a surface as a photograph and start grading it
 * against one. Every metal here is therefore barely metallic and quite
 * rough, and the environment contributes a hint rather than a mirror.
 *
 * Roughness maps still earn their place: flat roughness reads as "CG", and
 * stylized is not the same as careless.
 */
/**
 * Minimum cross-section for any long, thin, self-lit strip in the room.
 *
 * This is the one kind of jaggedness that NO post-process can repair, so
 * it has to be solved in the geometry. A strip only a few millimetres
 * thick projects to well under one pixel: the rasterizer then covers a
 * pixel only where the triangle happens to contain that pixel's centre,
 * and skips the rest. The line comes out as a row of dashes with gaps.
 *
 * SMAA cannot help — it blends edges that are present in the color
 * buffer, and here there is no edge to blend, just missing coverage. MSAA
 * would fix it by taking more samples per pixel, but that means a
 * multisampled target and the bandwidth to resolve it every frame, which
 * is the GPU cost we are explicitly avoiding. Making the strip wide
 * enough to always cover a whole pixel costs nothing at all: same vertex
 * count, same draw call, same shader.
 *
 * Rule of thumb: anything emissive and longer than ~20cm should be at
 * least this thick. Short strips (device LEDs, speaker trim) are exempt —
 * they are seen face-on and never stretch across enough pixels to dash.
 */
export const HAIRLINE_MIN = 0.022;

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
  /**
   * Ceiling cove LEDs. Basic, not standard: the strip is its own light
   * source, so shading it is pure waste — and being untone-mapped is the
   * whole point. The previous emissive-standard version was tone-mapped,
   * which put ACES between it and the framebuffer and landed it around
   * 0.8 luminance — just under Bloom's 0.9 threshold, so the one pass
   * that could have softened these lines never touched them.
   *
   * Overdriving the color past 1.0 writes a genuinely HDR value instead,
   * which Bloom picks up and blurs perpendicular to the run. That blur is
   * what actually kills the stair-stepping on a near-edge-on line, and it
   * costs nothing: Bloom is already in the pipeline on medium and high.
   * On the low tier there is no Bloom, but there the strips still read
   * cleanly on width alone (see COVE in Room.tsx).
   */
  get coveGlow() {
    let m = materialCache.get("coveGlow") as THREE.MeshBasicMaterial | undefined;
    if (!m) {
      m = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ffb375").multiplyScalar(2.4),
        toneMapped: false,
        fog: false,
      });
      materialCache.set("coveGlow", m);
    }
    return m;
  },
  /** Oiled solid walnut — the hero surface. Clearcoat removed: a second
      specular lobe on the largest object in frame was the single loudest
      "this is a render" signal in the room. */
  get deskTop() {
    return phys("deskTop", {
      color: "#a3805c", // deep tint — reads as oiled walnut, not raw pine
      map: walnutAlbedo(),
      roughnessMap: walnutRoughness(),
      roughness: 0.85,
      envMapIntensity: 0.3,
    });
  },
  /** Powder-coated steel, closer to charcoal than black. */
  get deskLeg() {
    return std("deskLeg", {
      color: palette.deskLeg,
      roughness: 0.82,
      metalness: 0.2,
      envMapIntensity: 0.22,
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
      roughness: 0.72,
      metalness: 0.25,
      envMapIntensity: 0.22,
    });
  },
  /**
   * Window frame rails and mullion.
   *
   * Same anodized look as `metalDark`, but deliberately duller. These are
   * 80mm bars seen almost edge-on from the default camera, so their lit
   * face is compressed into two or three pixels — and at metalDark's
   * roughness the specular lobe is narrower than that. The highlight then
   * varies faster than the sample grid and the rail renders as a dashed
   * line of sparkles, which reads as a broken line rather than a shiny
   * one. SMAA cannot help: it detects edges in the color buffer, and a
   * dashed highlight is not an edge.
   *
   * Widening the lobe (roughness up) and pulling the environment back
   * makes the same highlight vary slowly enough to land on every pixel of
   * the rail, so it resolves as one continuous soft band. Costs nothing —
   * it is the same shader with different uniforms. `metalDark` is shared
   * with the desk legs, HVAC and monitor bezel, where the sparkle is
   * wanted and the geometry is thick enough to carry it, so this is a
   * separate material rather than a detune of that one.
   */
  get windowFrame() {
    return std("windowFrame", {
      color: palette.metalDark,
      roughness: 0.78,
      metalness: 0.2,
      envMapIntensity: 0.18,
    });
  },
  /** Powder-coated aluminum — soft wide highlights, no mirror. */
  get metalMid() {
    return std("metalMid", {
      color: palette.metalMid,
      roughness: 0.76,
      metalness: 0.2,
      envMapIntensity: 0.24,
    });
  },
  /** Anodized device shells (monitor, laptop, keyboard case). */
  get deviceBody() {
    return std("deviceBody", {
      color: palette.deviceBody,
      roughness: 0.72,
      metalness: 0.12,
      envMapIntensity: 0.28,
    });
  },
  get keycap() {
    return std("keycap", {
      color: palette.keycap,
      roughness: 0.74,
      envMapIntensity: 0.22,
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
  /** Unglazed matte ceramic — the glaze was a mirror at desk scale. */
  get mug() {
    return phys("mug", {
      color: palette.mug,
      roughness: 0.62,
      envMapIntensity: 0.28,
    });
  },
  get whiteboard() {
    return std("whiteboard", {
      color: "#efece4",
      roughness: 0.58,
      metalness: 0,
      envMapIntensity: 0.25,
    });
  },
  get paper() {
    return std("paper", { color: "#eae6dd", roughness: 0.9 });
  },
  /**
   * Window pane. Deliberately NOT a transmissive material: any visible
   * `transmission > 0` makes three re-render the whole scene into a
   * transmission render target every single frame. For a flat pane with
   * nothing refracting behind it that buys nothing — a plain transparent
   * dielectric with a strong env highlight is visually equivalent here
   * and costs one draw call.
   */
  get glass() {
    return phys("glass", {
      color: "#dceaff",
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      // the specular sheen is what sold the transmission version —
      // push env intensity to keep it
      envMapIntensity: 0.7,
      clearcoat: 0.3,
      clearcoatRoughness: 0.15,
    });
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
      envMapIntensity: 0.08,
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

/* --------------------------- imported assets ----------------------------- */

/**
 * Materials already flattened. GLTF scenes are cached and cloned by drei,
 * so each material instance is shared across every placement — mutating it
 * once is both correct and enough, and the set makes that idempotent.
 */
const stylized = new WeakSet<THREE.Material>();

/**
 * Bring downloaded GLTF assets into the room's stylized grade.
 *
 * The Poly Haven models are photoscans, which makes them the most
 * physically-accurate things in the scene by a wide margin — and after the
 * hand-authored materials were flattened, that stopped being a virtue. A
 * scanned leather chair rendering with a tight specular lobe next to a
 * deliberately matte desk does not read as a nicer chair, it reads as two
 * different rooms composited together.
 *
 * Only the light RESPONSE is touched, never the maps: the albedo and
 * normal detail are what make these assets worth shipping, and the scans
 * carry their own colour far better than anything retyped by hand. What
 * changes is metalness, gloss and how much environment they reflect, which
 * is exactly the set of properties the rest of the room just gave up.
 *
 * Clamps rather than assignments, so an asset that is already matte is
 * left where it is instead of being dragged up to a uniform finish.
 */
export function stylizeAssetMaterials(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.material) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of list) {
      if (stylized.has(mat)) continue;
      stylized.add(mat);

      const std = mat as THREE.MeshStandardMaterial;
      if (!std.isMeshStandardMaterial) continue;
      std.metalness = Math.min(std.metalness, 0.2);
      std.roughness = Math.max(std.roughness, 0.68);
      std.envMapIntensity = 0.28;

      // A clearcoat is a second specular lobe on top of the first — the
      // single most "rendered" thing a surface can do, and nothing in this
      // room is wet or lacquered enough to justify one. Sheen is left
      // alone: it is broad and matte, and it is the whole point of the
      // fabric chair.
      const phys = mat as THREE.MeshPhysicalMaterial;
      if (phys.isMeshPhysicalMaterial) phys.clearcoat = 0;

      std.needsUpdate = true;
    }
  });
}
