/**
 * Frame-time benchmark for the 3D room.
 *
 * WHY IT LOOKS LIKE THIS
 *
 * The obvious version of this script — "load the page, count frames,
 * print average FPS" — produces a number that is worse than no number.
 * Four things are done deliberately instead:
 *
 * 1. WARMUP IS DISCARDED. The first seconds are shader compilation,
 *    texture upload, model decode and the first shadow bakes. Including
 *    them measures startup, not steady state, and they dominate.
 *
 * 2. PERCENTILES, NOT MEANS. Frame time is a skewed distribution with a
 *    long tail. A mean hides exactly the hitches a user notices; p95/p99
 *    are the frames they actually feel.
 *
 * 3. TWO PASSES, CAPPED AND UNCAPPED. requestAnimationFrame is
 *    vsync-locked, so a capped run can never report better than ~16.7ms
 *    no matter how much headroom exists — it answers "does it hold
 *    60fps", not "how fast is it". The uncapped pass disables the frame
 *    limiter to measure actual throughput. Both are reported, because
 *    they answer different questions and neither alone is honest.
 *
 * 4. REPEATED RUNS. One run is an anecdote. Each config runs N times in
 *    a fresh context and the spread across runs is reported, so a result
 *    inside the noise floor is visibly inside the noise floor.
 *
 * KNOWN LIMITS — read before quoting any of this
 *   - Headless Chromium on one machine's GPU. These are RELATIVE numbers
 *     for comparing configurations, not absolute numbers for "the site
 *     runs at X fps".
 *   - rAF timing measures wall-clock frame delivery, not GPU time. It
 *     cannot attribute cost to a specific pass; it only says the frame
 *     as a whole got slower or faster.
 *   - The quality tier is forced via ?quality=, so this measures the
 *     TIER, not the detection heuristic that would pick it.
 *
 * USAGE
 *   node bench/bench.mjs [--url=http://localhost:3177] [--runs=3]
 *                        [--sample=10000] [--warmup=4000]
 *                        [--tiers=low,medium,high]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
};

const URL_BASE = arg("url", "http://localhost:3177");
const RUNS = Number(arg("runs", "3"));
const SAMPLE_MS = Number(arg("sample", "10000"));
const WARMUP_MS = Number(arg("warmup", "4000"));
const TIERS = arg("tiers", "low,medium,high").split(",");

/** 60fps interval */
const BUDGET_MS = 1000 / 60;
/**
 * A DROPPED frame, i.e. one that missed a vsync and forced the compositor
 * to repeat the previous image.
 *
 * Not `> BUDGET_MS`. Vsync delivers at ~16.70ms against a 16.667ms budget,
 * so a naive over-budget count flags ~60% of frames on a run that is
 * holding a perfect 60fps — a scary-looking number that means nothing.
 * A real miss costs a whole interval, so the threshold is 1.5x.
 */
const DROP_MS = BUDGET_MS * 1.5;

const GPU_FLAGS = [
  "--enable-gpu",
  "--use-angle=d3d11",
  "--ignore-gpu-blocklist",
  "--no-sandbox",
];
/** removes the vsync ceiling so throughput is observable */
const UNCAPPED_FLAGS = [
  "--disable-frame-rate-limit",
  "--disable-gpu-vsync",
  "--disable-features=CalculateNativeWinOcclusion",
];

/* ------------------------------- statistics ------------------------------ */

/** nearest-rank percentile on an already-sorted array */
const pct = (sorted, p) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] : NaN;

function summarise(frames) {
  const s = [...frames].sort((a, b) => a - b);
  const n = s.length;
  const mean = s.reduce((a, b) => a + b, 0) / n;
  return {
    frames: n,
    p50: pct(s, 50),
    p95: pct(s, 95),
    p99: pct(s, 99),
    mean,
    worst: s[n - 1],
    /** the metric that actually tracks perceived smoothness */
    droppedPct: (s.filter((t) => t > DROP_MS).length / n) * 100,
    /** a frame this long reads as a visible hitch */
    over33Pct: (s.filter((t) => t > 33).length / n) * 100,
  };
}

/** median of per-run values + half the spread, so noise is visible */
function acrossRuns(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = s[Math.floor(s.length / 2)];
  return { median: mid, min: s[0], max: s[s.length - 1] };
}

/* ------------------------------- measurement ----------------------------- */

/**
 * Collect frame intervals in-page. Started without awaiting so the driver
 * can drive input (orbiting) while sampling is live.
 */
async function startSampling(page, ms) {
  await page.evaluate((ms) => {
    window.__bench = { times: [], done: false };
    let last = performance.now();
    const start = last;
    const tick = (now) => {
      window.__bench.times.push(now - last);
      last = now;
      if (now - start < ms) requestAnimationFrame(tick);
      else window.__bench.done = true;
    };
    requestAnimationFrame(tick);
  }, ms);
}

async function finishSampling(page, ms) {
  await page.waitForFunction(() => window.__bench?.done === true, { timeout: ms + 30000 });
  // drop the first interval: it spans the gap before the loop settled
  return (await page.evaluate(() => window.__bench.times)).slice(1);
}

/** continuous orbit drag, to measure the scene while the camera moves */
async function orbit(page, ms) {
  const t0 = Date.now();
  await page.mouse.move(720, 450);
  await page.mouse.down();
  while (Date.now() - t0 < ms) {
    const k = ((Date.now() - t0) / 900) % (Math.PI * 2);
    await page.mouse.move(720 + Math.sin(k) * 240, 450 + Math.cos(k) * 60, { steps: 3 });
  }
  await page.mouse.up();
}

async function runOnce({ tier, scenario, uncapped }) {
  const browser = await chromium.launch({
    args: uncapped ? [...GPU_FLAGS, ...UNCAPPED_FLAGS] : GPU_FLAGS,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${URL_BASE}/?quality=${tier}`, {
      waitUntil: "networkidle",
      timeout: 120000,
    });
    // the loader hides only once the scene reports ready
    await page
      .locator("text=INITIALIZING WORKSPACE")
      .waitFor({ state: "hidden", timeout: 180000 })
      .catch(() => {});

    // warmup: shader compile, first shadow bakes, contact-shadow bake
    await page.waitForTimeout(WARMUP_MS);

    await startSampling(page, SAMPLE_MS);
    if (scenario === "orbit") await orbit(page, SAMPLE_MS);
    const times = await finishSampling(page, SAMPLE_MS);
    return summarise(times);
  } finally {
    await browser.close();
  }
}

/* --------------------------------- driver -------------------------------- */

const results = [];

for (const uncapped of [false, true]) {
  for (const tier of TIERS) {
    for (const scenario of ["idle", "orbit"]) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        process.stdout.write(
          `  ${uncapped ? "uncapped" : "capped  "} ${tier.padEnd(6)} ${scenario.padEnd(5)} run ${i + 1}/${RUNS} ... `,
        );
        const r = await runOnce({ tier, scenario, uncapped });
        runs.push(r);
        process.stdout.write(`p50 ${r.p50.toFixed(2)}ms\n`);
      }
      results.push({
        mode: uncapped ? "uncapped" : "capped",
        tier,
        scenario,
        runs,
        p50: acrossRuns(runs.map((r) => r.p50)),
        p95: acrossRuns(runs.map((r) => r.p95)),
        p99: acrossRuns(runs.map((r) => r.p99)),
        dropped: acrossRuns(runs.map((r) => r.droppedPct)),
      });
    }
  }
}

/* --------------------------------- report -------------------------------- */

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(HERE, "results");
fs.mkdirSync(outDir, { recursive: true });

const meta = {
  when: new Date().toISOString(),
  url: URL_BASE,
  runs: RUNS,
  sampleMs: SAMPLE_MS,
  warmupMs: WARMUP_MS,
  viewport: "1440x900",
};

fs.writeFileSync(
  path.join(outDir, `${stamp}.json`),
  JSON.stringify({ meta, results }, null, 2),
);

const f = (n) => (Number.isFinite(n) ? n.toFixed(2) : "—");
const row = (r) =>
  `| ${r.mode} | ${r.tier} | ${r.scenario} | ${f(r.p50.median)} | ${f(r.p95.median)} | ` +
  `${f(r.p99.median)} | ${f(r.dropped.median)}% | ${f(r.p50.min)}–${f(r.p50.max)} |`;

const md = [
  `# Frame-time benchmark`,
  ``,
  `${meta.when} · ${meta.runs} runs × ${meta.sampleMs / 1000}s sampled after ${meta.warmupMs / 1000}s warmup · ${meta.viewport}`,
  ``,
  `Frame times in ms; lower is better. \`capped\` is vsync-locked and answers`,
  `"does it hold 60fps" — its p50 floor is ~16.7ms by construction.`,
  `\`uncapped\` disables the frame limiter and answers "how much headroom".`,
  `\`dropped\` is the share of frames that missed a whole vsync interval`,
  `(>25ms). Deliberately not ">16.7ms": vsync lands at ~16.70ms against a`,
  `16.667ms budget, so that comparison flags ~60% of frames on a run that`,
  `is perfectly smooth.`,
  `\`p50 spread\` is min–max across runs: if two configs overlap here, the`,
  `difference between them is noise.`,
  ``,
  `| mode | tier | scenario | p50 | p95 | p99 | dropped | p50 spread |`,
  `| --- | --- | --- | --- | --- | --- | --- | --- |`,
  ...results.map(row),
  ``,
  `Measured headless on one machine's GPU. Relative comparison only —`,
  `not a claim about what any given visitor sees.`,
  ``,
].join("\n");

fs.writeFileSync(path.join(outDir, `${stamp}.md`), md);
console.log(`\n${md}`);
console.log(`written: bench/results/${stamp}.{json,md}`);
