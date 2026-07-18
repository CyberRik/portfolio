import * as THREE from "three";

/**
 * Procedural texture atelier.
 * Every map is generated once on a canvas at startup (client-only),
 * cached, and shared. No network fetches, no licensing, and the
 * roughness variation is what sells "expensive" at glancing angles.
 */
const cache = new Map<string, THREE.CanvasTexture>();

/* ---------------------------------- noise --------------------------------- */

function makeNoise(seed: number) {
  const perm = new Uint8Array(512);
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = (t: number) => t * t * (3 - 2 * t);
  const grad = (h: number) => (h & 1 ? 1 : -1);

  function noise2(x: number, y: number) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    return (
      lerp(
        lerp(grad(aa) * xf, grad(ba) * (xf - 1), u),
        lerp(grad(ab) * yf, grad(bb) * (yf - 1), u),
        v,
      ) *
        0.5 +
      0.5
    );
  }

  function fbm(x: number, y: number, octaves = 4) {
    let value = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < octaves; o++) {
      value += noise2(x * freq, y * freq) * amp;
      amp *= 0.5;
      freq *= 2;
    }
    return value;
  }

  return { noise2, fbm };
}

/* -------------------------------- factory --------------------------------- */

type PixelFn = (x: number, y: number) => [number, number, number];

function generate(
  key: string,
  size: number,
  fn: PixelFn,
  opts: { srgb?: boolean; repeat?: [number, number] } = {},
): THREE.CanvasTexture {
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = fn(x, y);
      const i = (y * size + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (opts.srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) tex.repeat.set(...opts.repeat);
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/* -------------------------------- walnut ---------------------------------- */

/** Solid walnut for the desk — long wavy grain along x, warm and deep. */
export function walnutAlbedo() {
  const { fbm } = makeNoise(11);
  return generate(
    "walnutAlbedo",
    512,
    (x, y) => {
      const wave = fbm(x * 0.006, y * 0.02, 3) * 46;
      const ring = Math.sin(y * 0.16 + wave);
      const g = ring * 0.5 + 0.5;
      const fine = fbm(x * 0.05, y * 0.4, 2);
      // dark chocolate → warm caramel
      const r = mix(74, 128, g) + fine * 14 - 7;
      const gr = mix(50, 88, g) + fine * 10 - 5;
      const b = mix(34, 58, g) + fine * 7 - 3;
      return [r, gr, b];
    },
    { srgb: true, repeat: [2, 1] },
  );
}

export function walnutRoughness() {
  const { fbm } = makeNoise(12);
  return generate("walnutRoughness", 256, (x, y) => {
    const wave = fbm(x * 0.012, y * 0.04, 3) * 23;
    const ring = Math.sin(y * 0.32 + wave) * 0.5 + 0.5;
    // satin finish: rougher in the open grain, glossier on the plateaus
    const v = mix(150, 200, ring) + fbm(x * 0.1, y * 0.1, 2) * 30 - 15;
    return [v, v, v];
  });
}

/* ------------------------------- oak floor -------------------------------- */

/** Wide oak planks running along x with per-plank tone shift + seams. */
export function plankAlbedo() {
  const { fbm, noise2 } = makeNoise(21);
  const PLANKS = 7;
  return generate(
    "plankAlbedo",
    512,
    (x, y) => {
      const row = Math.floor((y / 512) * PLANKS);
      const local = ((y / 512) * PLANKS) % 1;
      const tone = 0.82 + noise2(row * 7.3, 2.1) * 0.36;
      const wave = fbm(x * 0.008, (y + row * 91) * 0.05, 3) * 30;
      const ring = Math.sin(y * 0.35 + wave) * 0.5 + 0.5;
      const fine = fbm(x * 0.07, y * 0.3, 2);
      let r = (mix(96, 134, ring) + fine * 12) * tone;
      let g = (mix(72, 100, ring) + fine * 9) * tone;
      let b = (mix(52, 70, ring) + fine * 6) * tone;
      // seams between planks
      const seam = local < 0.02 || local > 0.98 ? 0.55 : 1;
      // occasional butt joints
      const joint = noise2(Math.floor(x / 170) * 3.7, row * 5.1) > 0.8 && x % 170 < 3 ? 0.6 : 1;
      r *= seam * joint;
      g *= seam * joint;
      b *= seam * joint;
      return [r, g, b];
    },
    { srgb: true, repeat: [2, 2] },
  );
}

export function plankRoughness() {
  const { fbm } = makeNoise(22);
  return generate(
    "plankRoughness",
    256,
    (x, y) => {
      // worn satin sheen with subtle traffic variation
      const wear = fbm(x * 0.015, y * 0.015, 3);
      const grain = fbm(x * 0.1, y * 0.25, 2);
      const v = 140 + wear * 60 + grain * 25;
      return [v, v, v];
    },
    { repeat: [2, 2] },
  );
}

/* -------------------------------- plaster --------------------------------- */

/** Barely-there tonal variation for the walls — kills the "flat CG" look. */
export function plasterAlbedo() {
  const { fbm } = makeNoise(31);
  return generate(
    "plasterAlbedo",
    256,
    (x, y) => {
      const n = fbm(x * 0.02, y * 0.02, 4);
      const v = 232 + n * 26; // multiplied by wall color → ±5% variation
      return [v, v, v];
    },
    { repeat: [3, 2] },
  );
}

export function plasterRoughness() {
  const { fbm } = makeNoise(32);
  return generate(
    "plasterRoughness",
    256,
    (x, y) => {
      const v = 210 + fbm(x * 0.04, y * 0.04, 3) * 40;
      return [v, v, v];
    },
    { repeat: [3, 2] },
  );
}

/* --------------------------------- fabric --------------------------------- */

/** Fine twill weave for the chair + desk mat. Doubles as a bump map. */
export function fabricMap() {
  const { fbm } = makeNoise(41);
  return generate(
    "fabricMap",
    256,
    (x, y) => {
      const weave =
        (Math.sin(x * 1.1) * 0.5 + 0.5) * 0.5 + (Math.sin(y * 1.1 + x * 0.5) * 0.5 + 0.5) * 0.5;
      const slub = fbm(x * 0.03, y * 0.03, 3) * 0.3;
      const v = 200 + (weave - 0.5) * 46 + slub * 40;
      return [v, v, v];
    },
    { repeat: [4, 4] },
  );
}
