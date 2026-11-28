/**
 * The engineering record — milestones and project case studies.
 *
 * portfolio.ts holds the résumé-level facts (roles, bullets, skills).
 * This file is the layer above it: the *story* those facts add up to,
 * organised as chapters rather than dates, plus a full case study per
 * project. RM-OS's Timeline and Projects apps both read from here, and
 * they cross-link through the ids below — a milestone names its
 * projects, a project names its milestone, so any path through the
 * portfolio can reach any other.
 *
 * AUTHENTICITY RULE
 * Nothing in this file may be invented. Where the real detail isn't
 * written down yet, the field holds a todo() marker instead of plausible
 * filler; the UI renders those as a visible "not written yet" state.
 * Replace the markers with real content — never delete them to hide a gap.
 */

import { EDUCATION, PROFILE } from "@/content/portfolio";

/** an unwritten field — rendered as a visible gap, never as prose */
/**
 * The marker must never collide with real prose, and must stay plain
 * ASCII — an earlier version used NUL bytes as delimiters, which made
 * git classify this file as binary (no diffs, no blame) and broke grep.
 */
const TODO_MARK = "@@TODO@@ ";
export const todo = (hint: string) => `${TODO_MARK}${hint}`;
export const isTodo = (s: string) => s.startsWith(TODO_MARK);
export const todoHint = (s: string) => s.slice(TODO_MARK.length);

/* ------------------------------------------------------------------ */
/* architecture diagrams                                              */

export type NodeKind = "input" | "core" | "store" | "model" | "output";

export interface ArchNode {
  id: string;
  label: string;
  /** one-line role of this node; omit rather than guess */
  sub?: string;
  col: number;
  row: number;
  kind?: NodeKind;
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
  /** dashed = asynchronous / out-of-band */
  dashed?: boolean;
}

export interface ArchDiagram {
  caption: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
}

/* ------------------------------------------------------------------ */
/* demos                                                              */

/**
 * A recorded walkthrough of the running system.
 *
 * Demos are hosted on YouTube and never in `public/` — a 2-minute
 * screen capture is ~40 MB, which is both over Vercel's per-file
 * deployment ceiling and bandwidth this site should not be paying for.
 * What ships locally is the poster frame: a single JPEG that stands in
 * for the player until somebody actually asks for it.
 *
 * That split is the whole performance story. RM-OS renders as live DOM
 * on the monitor's screen plane, so an <iframe> there is legal but
 * expensive; the poster costs one cached image and the player is only
 * ever mounted in popped-out mode, where the R3F loop is already
 * frozen (see PortalSuspend) and nothing competes with it.
 */

/** a seek point in a recording — finer-grained than the YouTube chapter list */
export interface DemoChapter {
  /** seconds from the start of the video */
  at: number;
  label: string;
}

export interface ProjectDemo {
  /** YouTube video id */
  youtube: string;
  /** runtime, pre-formatted — shown before any player exists */
  length: string;
  /** poster frame, served from public/ */
  poster: string;
  /** what the recording *proves*, not what it contains */
  blurb: string;
  /** the moment worth linking to on its own, if there is one */
  highlight?: DemoChapter;
  chapters: DemoChapter[];
}

/* ------------------------------------------------------------------ */
/* projects                                                           */

export type ProjectId =
  | "ancora"
  | "tinyserve"
  | "senpai"
  | "toolcalllm"
  | "gravton"
  | "tax-cpa-parser"
  | "reach"
  | "indic-asr"
  | "desi-agent"
  | "medproqa"
  | "smartfan"
  | "rrt";

export type MilestoneId =
  | "foundations"
  | "building"
  | "production"
  | "data-systems"
  | "ai-infra"
  | "enterprise"
  | "current";

export interface ProjectDoc {
  id: ProjectId;
  title: string;
  /**
   * Name for places that get one short line — the desktop icon grid, where a
   * full title like "Gravton — Crawler, Citations & Social Pipelines" wraps to
   * three lines and dwarfs its own icon. Optional: only set it where the title
   * is too long to sit under a 38px square. Everywhere with room (tab list,
   * window titlebar, case study header) keeps the full `title`.
   */
  shortTitle?: string;
  tier: "featured" | "archive";
  role: string;
  period: string;
  /** where this sat — company, programme, or "personal" */
  context: string;
  /** one line, shown under the title in the tab list */
  tagline: string;
  milestone: MilestoneId;

  overview: string;
  problem: string;
  architecture: { summary: string; diagram?: ArchDiagram };
  challenges: { title: string; body: string }[];
  stack: { group: string; items: string[] }[];
  results: string[];
  lessons: string[];
  timeline: { when: string; what: string }[];
  /** a recorded walkthrough, where one exists */
  demo?: ProjectDemo;
  links: { label: string; href: string }[];
  /** other projects worth reading next */
  related: ProjectId[];
}

export const PROJECT_DOCS: Record<ProjectId, ProjectDoc> = {
  /* ---------------------------------------------------------------- */
  ancora: {
    id: "ancora",
    title: "Ancora",
    tier: "featured",
    role: "Solo Developer",
    period: "Jul 2026 – Present",
    context: "Personal project · open source",
    tagline: "A fault-tolerant runtime for durable AI workflows — kill any worker mid-run and prove nothing was lost",
    milestone: "current",

    overview:
      "A durable execution runtime for AI workflows. Temporal records every side-effecting step as an immutable event, Ray runs the heavy compute, and a pool of activity workers sits between them. If a worker dies mid-run, the workflow replays to exact state and a surviving worker finishes the job. Ancora is not an agent framework. It is the runtime that belongs underneath one.",
    problem:
      "AI pipelines lose work for boring reasons: an LLM call returns a 500, a GPU worker runs out of memory, a provider rate-limits, a pod is evicted. A multi-step, multi-dollar run disappears with no way to resume it. Durable execution fixes that in principle, but \"kill a worker and the run survives\" is easy to claim and hard to prove. The interesting failure is not the crash itself but whether an effect that was half-committed when the process died fires again on recovery.",
    architecture: {
      summary:
        "The FastAPI gateway starts and signals workflows on Temporal, which owns all execution state. Workflow workers poll their own queue and only decide what to schedule, because workflow code must replay deterministically; every node runs instead as a run_node activity on capability queues (cpu, io, gpu) served by three activity-worker replicas. Before a node starts, the activity asks the scheduler to admit, defer or reject it. A deferral becomes a retryable error with a backoff, so waiting work sits in Temporal history rather than in a scheduler queue, and the client fails open so a scheduler outage never halts the fleet. Side-effecting nodes reserve a key in a Postgres inbox before running, which turns at-least-once activities into exactly-once effects. Heavy compute goes to Ray, or an in-process thread pool when no cluster is configured, and long jobs use async completion so the worker's slot is freed at once. Observability is a separate, losable plane: an activity interceptor writes lifecycle events to per-run Redis Streams, the API tails them over WebSocket for the live DAG, and an event consumer projects them into Postgres while a reconciler re-derives run status from Temporal history. Losing Redis or Postgres projections costs liveness in the UI, never correctness.",
      diagram: {
        caption: "Ancora — the durability core, the node execution path, and the losable observability plane",
        nodes: [
          { id: "api", label: "API Gateway", sub: "FastAPI · REST + WS", col: 0, row: 1, kind: "input" },
          { id: "temporal", label: "Temporal", sub: "history · source of truth", col: 1, row: 1, kind: "store" },
          { id: "ww", label: "Workflow Workers", sub: "deterministic decisions", col: 2, row: 0, kind: "core" },
          { id: "aw", label: "Activity Workers ×3", sub: "run_node · 2s heartbeat", col: 2, row: 2, kind: "core" },
          { id: "bus", label: "Redis Streams", sub: "per-run event log", col: 3, row: 1, kind: "store" },
          { id: "ray", label: "Ray / Local backend", sub: "async completion", col: 3, row: 2, kind: "core" },
          { id: "sched", label: "Scheduler", sub: "admit · defer · reject", col: 3, row: 3, kind: "core" },
          { id: "inbox", label: "Inbox (Postgres)", sub: "exactly-once effects", col: 3, row: 4, kind: "store" },
          { id: "consumer", label: "Event Consumer", sub: "projector + reconciler", col: 4, row: 0, kind: "core" },
          { id: "pg", label: "Postgres", sub: "projections · rebuildable", col: 5, row: 0, kind: "store" },
          { id: "dash", label: "Dashboard", sub: "live DAG · Chaos Lab", col: 6, row: 1, kind: "output" },
        ],
        edges: [
          { from: "api", to: "temporal", label: "start · signal" },
          { from: "temporal", to: "ww", label: "workflow tasks" },
          { from: "temporal", to: "aw", label: "poll · heartbeat" },
          { from: "ww", to: "temporal", label: "commands" },
          { from: "aw", to: "bus", dashed: true, label: "activity events" },
          { from: "ww", to: "bus", dashed: true },
          { from: "aw", to: "ray", label: "dispatch" },
          { from: "aw", to: "sched", label: "admit?" },
          { from: "aw", to: "inbox", label: "reserve key" },
          { from: "bus", to: "consumer", label: "consumer group" },
          { from: "consumer", to: "pg", label: "upsert" },
          { from: "consumer", to: "temporal", dashed: true, label: "reconcile" },
          { from: "pg", to: "dash", label: "read models" },
          { from: "bus", to: "dash", dashed: true, label: "WS tail via API" },
        ],
      },
    },
    challenges: [
      {
        title: "Chaos experiments that assert instead of demonstrate",
        body:
          "A demo that kills a worker and ends on a green checkmark proves nothing. The chaos engine asks the Docker daemon to SIGKILL a real activity-worker container mid-run, waits out the actual recovery, then checks three invariants from Temporal's own history and the inbox rows: the run completed, no completed activity ran twice, and no effect was left half-committed. Recovery time is measured against an SLO. The checkers are pure functions, so CI runs them against synthetic post-kill histories without a live cluster.",
      },
      {
        title: "Reconstructing a run's DAG without timing heuristics",
        body:
          "Workflows are ordinary Python that decide step by step what to schedule, so the graph is emergent and fan-out width comes from the input. Comparing timestamps to infer parallelism draws a fan-out as a plausible-looking chain. Ancora reads causality instead: every ActivityTaskScheduled event names the workflow task that commanded it, so activities sharing that id were decided together. The columns are exact, and with no layout library the graph never drifts between polls.",
      },
      {
        title: "Temporal writes ActivityTaskStarted lazily",
        body:
          "The started event for an attempt is only written once the attempt reaches a terminal state. An attempt running right now, including one stranded on a just-killed worker, is absent from history, so a history-only view draws it as still queued. The recovery view folds in describe().pending_activities and separates three waits that look identical from outside: queued for capacity, detecting a dead worker, and retry backoff.",
      },
      {
        title: "Exactly-once has to survive a crash mid-effect",
        body:
          "The inbox's unique key already makes two result rows for one effect impossible, so duplicates were never the real risk. A kill introduces the opposite case: an effect that reserved its key as pending, then lost its worker before committing the result. The chaos engine asserts every guarded effect reached done, so a half-committed effect fails the experiment instead of surfacing later as a double charge.",
      },
      {
        title: "Durability is not liveness",
        body:
          "Temporal keeps state safe through any worker death, but a stranded activity only finishes if some worker polls its queue, so fault tolerance had to become a pool of three replicas. Detection was the second half: without heartbeats a dead worker's activity is noticed only at start_to_close, up to 60 seconds. run_node now heartbeats every 2 seconds under a ~6 second timeout, which cut detection to about 6 seconds and exposed a policy that declared a 30-second heartbeat timeout nothing ever met. SIGKILL also skips deregistration, so a reaper prunes orphaned worker rows and a live worker re-registers if its row was reaped.",
      },
    ],
    stack: [
      { group: "Durability", items: ["Temporal", "Event sourcing", "Deterministic replay", "Idempotency inbox"] },
      { group: "Compute", items: ["Ray", "Async activity completion", "Heartbeat checkpointing"] },
      { group: "Services", items: ["Python 3.11", "FastAPI", "Pydantic v2", "SQLAlchemy", "Postgres", "Redis Streams"] },
      { group: "Observability", items: ["OpenTelemetry", "Jaeger", "Prometheus", "Grafana"] },
      { group: "Web", items: ["Next.js 15", "React 19", "React Flow", "WebSocket live tail"] },
      { group: "Quality", items: ["pytest", "mypy --strict", "ruff", "Playwright", "CodeQL", "Docker Compose"] },
    ],
    results: [
      "Chaos experiments that SIGKILL a live worker container mid-run and machine-check three invariants from Temporal history (run completed, no re-executed activities, exactly-once effects), with recovery time measured against an SLO.",
      "Kill detection cut from ~60s to ~6s (9.5×) by heartbeating activities under a short heartbeat timeout.",
      "Run DAGs reconstructed from event causality rather than timestamps: exact fan-out, live per-node state, retries collapsed, critical path highlighted.",
      "One unbroken OpenTelemetry trace from the API through workflow and activity to the compute call, carried across the Ray process boundary as a W3C traceparent in the payload.",
      "284 passing tests, mypy --strict and ruff clean across the workspace; every subsystem ships a replay test and, where it touches failure, a chaos assertion.",
      "Tagged v0.1.0 and v0.1.1, with CodeQL, Dependabot and the OpenSSF Best Practices passing badge. The full stack (Temporal, Postgres, Redis, three worker replicas, scheduler, Jaeger, Prometheus, Grafana, dashboard) starts with one make up.",
    ],
    lessons: [
      "A durability claim is worth nothing until something asserts it. Turning the demo into a test that checks invariants from history is the difference between a screenshot and a guarantee.",
      "Durability and liveness are separate properties. State survives any crash; progress still needs a live worker polling the queue, and a fast way to notice when one is gone.",
      "Read the event log's semantics before building on it. Because ActivityTaskStarted is written lazily, a history-only view got wrong exactly the stranded attempt it was built to explain.",
      "Give every datum one owner. Only Temporal holds execution state, so Redis, the projections and even the scheduler can fail or restart without changing what a workflow does next.",
    ],
    timeline: [
      { when: "21 Jul 2026", what: "Monorepo scaffold, Compose stack, API gateway and dashboard shell." },
      { when: "22 Jul 2026", what: "Durable core and SDK; activity workers with Ray dispatch and async completion; first worker-crash durability test." },
      { when: "23 Jul 2026", what: "Admission scheduler, built-in node library, idempotency inbox; Chaos Lab and the recovery view." },
      { when: "26 Jul 2026", what: "Event-sourced observability: projections, live DAG over WebSocket, OTel tracing, Prometheus/Grafana, replay and critical path." },
      { when: "27 Jul 2026", what: "Asserting chaos experiments and fast failover via heartbeats." },
      { when: "27 Aug 2026", what: "v0.1.0: resilient worker registration, demo walkthrough, first tagged release." },
      { when: "26 Oct 2026", what: "v0.1.1: security release; dashboard moved to Next.js 15 and React 19, CodeQL and Dependabot added." },
      { when: "Next", what: "Kubernetes (Helm/KubeRay/KEDA), OIDC/RBAC and tenant isolation, signed third-party plugins." },
    ],
    demo: {
      youtube: "UVKmMZnP50A",
      length: "2:38",
      poster: "/demos/ancora.jpg",
      blurb:
        "The running system end to end — nothing mocked. Every graph is reconstructed from Temporal's real event history, and it closes by SIGKILLing a live worker mid-run and machine-checking that the run recovered correctly.",
      highlight: { at: 121, label: "The chaos experiment — PASS, with the invariants it checked" },
      chapters: [
        { at: 0, label: "Durable execution, in one line" },
        { at: 12, label: "Real runs, started live" },
        { at: 24, label: "Parked at a human gate — waiting costs no compute" },
        { at: 36, label: "The DAG, reconstructed from history" },
        { at: 48, label: "Deterministic replay" },
        { at: 64, label: "A worker dies mid-pipeline" },
        { at: 76, label: "Chaos Lab — a real SIGKILL" },
        { at: 88, label: "A dead worker and a slow worker look identical" },
        { at: 96, label: "The fan-out finishes — one lost attempt, no lost work" },
        { at: 116, label: "An experiment, not a demonstration" },
        { at: 121, label: "PASS — three invariants, machine-checked" },
        { at: 142, label: "Temporal's own UI — the same runs" },
      ],
    },
    links: [
      { label: "GitHub", href: "https://github.com/CyberRik/Ancora" },
      { label: "RFC-0001", href: "https://github.com/CyberRik/Ancora/blob/main/docs/RFC-0001-durable-ai-runtime.md" },
      { label: "Implementation plan", href: "https://github.com/CyberRik/Ancora/blob/main/docs/IMPLEMENTATION-PLAN.md" },
    ],
    related: ["tinyserve", "senpai", "gravton"],
  },

  /* ---------------------------------------------------------------- */
  tinyserve: {
    id: "tinyserve",
    title: "TinyServe",
    tier: "featured",
    role: "Solo Developer",
    period: "Aug 2026 – Present",
    context: "Personal project · open source",
    tagline: "A from-scratch LLM inference runtime on llama.cpp — continuous batching, KV-cache accounting, prefix reuse and fair scheduling, built to be fully explainable",
    milestone: "current",

    overview:
      "A small inference server built on llama.cpp, with everything above the matrix multiply written from scratch in async Python: admission control, continuous batching with chunked prefill, block-based KV-cache accounting, pluggable FIFO / Priority / WFQ scheduling, and prefix reuse through a C++ radix tree. llama.cpp computes the logits. TinyServe decides who gets a slot, what goes into each batch, when a request is refused, and how tokens reach the client. Every claim in the repo is backed by a benchmark run against a real model, including the ones that came out negative.",
    problem:
      "Continuous batching, paged KV memory and fairness-aware admission are usually learned by reading about vLLM and SGLang, whose implementations are too large to trace end to end. The goal was not to compete with them on throughput. It was to build the same ideas small enough that any latency number can be traced to a specific scheduling decision in the code, and confirmed by a metric rather than inferred.",
    architecture: {
      summary:
        "HTTP handlers never touch the model. POST /generate tokenizes the prompt, runs the Admission Controller, and pushes the request into a waiting pool; a single background asyncio task, the batch loop, owns every call into llama.cpp, so its state needs no locks. Admission is fail-fast and runs two checks in order: queue depth against max_queue_depth, then a worst-case reservation of prompt + max_tokens in the KV Cache Manager, a logical block ledger over one llama_context created with kv_unified=True. Either failure returns 503 with Retry-After and a distinct reason, so an accepted request is guaranteed room to finish. Each tick the loop expires stale waiters, lets the active policy choose which waiters claim free sequence slots, and asks the prefix cache whether another live sequence already holds a block-aligned prefix of the prompt; on a hit, llama_memory_seq_cp shares the donor's cells and the new sequence starts at a non-zero n_past. The Batch Builder then packs decode steps first and caps each prefill at chunk_size, and one llama_decode() call, run off the event loop in a worker thread, advances every active sequence together; greedy-sampled tokens stream out over SSE through the Stream Manager's incremental UTF-8 decoder. On finish the sequence is evicted from the prefix tree before its seq_id returns to the free pool, then its KV cells and blocks are released. A decode error finishes every active request with a labelled cancellation instead of wedging the loop.",
      diagram: {
        caption: "TinyServe — admission, slot scheduling and one shared llama_decode() per tick",
        nodes: [
          { id: "client", label: "Client", sub: "curl or /demo page", col: 0, row: 1, kind: "input" },
          { id: "admission", label: "Admission Controller", sub: "queue cap, then KV budget", col: 1, row: 1, kind: "core" },
          { id: "kv", label: "KV Cache Manager", sub: "logical block ledger", col: 2, row: 0, kind: "store" },
          { id: "queue", label: "Request Queue", sub: "reorderable waiting pool", col: 2, row: 2, kind: "core" },
          { id: "policy", label: "Scheduling Policy", sub: "FIFO · Priority · WFQ", col: 3, row: 2, kind: "core" },
          { id: "batch", label: "Batch Builder", sub: "decode first, then prefill", col: 4, row: 1, kind: "core" },
          { id: "prefix", label: "Prefix Cache", sub: "block-aligned radix tree", col: 4, row: 2, kind: "store" },
          { id: "runtime", label: "LlamaRuntime", sub: "llama_decode · kv_unified", col: 5, row: 1, kind: "model" },
          { id: "metrics", label: "Prometheus · OTel", sub: "/metrics, request spans", col: 6, row: 0, kind: "output" },
          { id: "stream", label: "Stream Manager", sub: "UTF-8 reassembly · SSE", col: 6, row: 2, kind: "output" },
        ],
        edges: [
          { from: "client", to: "admission", label: "POST /generate" },
          { from: "admission", to: "client", dashed: true, label: "503 Retry-After" },
          { from: "admission", to: "kv", label: "reserve blocks" },
          { from: "admission", to: "queue", label: "accept" },
          { from: "queue", to: "policy", label: "free slot" },
          { from: "policy", to: "batch", label: "admit seq_id" },
          { from: "policy", to: "prefix", label: "prefix lookup" },
          { from: "batch", to: "runtime", label: "1 batch / tick" },
          { from: "prefix", to: "runtime", label: "seq_cp donor" },
          { from: "runtime", to: "metrics", dashed: true, label: "decode timing" },
          { from: "runtime", to: "stream", label: "greedy token" },
          { from: "stream", to: "client", dashed: true, label: "SSE tokens" },
        ],
      },
    },
    challenges: [
      {
        title: "Proving multi-sequence batching before building on it",
        body:
          "The whole design depends on one llama_decode() call advancing several independent requests, and llama-cpp-python's high-level Llama class does not expose that. It was proven first with a standalone proof-of-concept against the low-level ctypes API. The Runtime now keeps the Llama object only for weights and tokenizer, and builds its own context with n_seq_max slots and a unified KV cache.",
      },
      {
        title: "What a policy can actually control under continuous batching",
        body:
          "Once a sequence holds a slot it advances every tick, whatever the policy says. The one real lever left is which waiting request claims a slot when one frees up, so FIFO, Priority and WFQ are implemented as three answers to that question behind one select() protocol. WFQ charges 1/weight of virtual time per admission, and a returning class adopts the current minimum instead of zero, so it gets no head start.",
      },
      {
        title: "Prefix reuse that fails as wrong text, not a crash",
        body:
          "If a finished sequence's seq_id were recycled while the tree still listed it as a donor, the next match would copy cells that now hold another prompt, producing fluent, plausible, wrong output. The batch loop evicts from the tree before the slot returns to the pool, and the Runtime checks the donor still covers the range before copying, falling back to a full prefill when it does not. Matches are also clamped to leave one block to prefill, because a fully reused prompt would have no batch row, never sample a token, and hold its slot forever.",
      },
      {
        title: "A benchmark that argued against its own hypothesis",
        body:
          "Chunked prefill was expected to protect short requests' tail latency from a long prompt. At chunk_size 32 versus effectively unchunked, short-prompt TTFT p95 was 2.67s against 2.51s: no meaningful difference. The mechanism was traced instead of tuned away. build_batch sorts by pending-token count, so short work is always packed ahead of a long prefill regardless of chunk size.",
      },
      {
        title: "Checking the shipped code against the design doc",
        body:
          "A pass over the code against the PRD found the Admission Controller checked only KV budget, so a burst of small requests could grow the waiting pool without bound. A queue-depth check now runs first and rejects with its own queue_full reason. The same pass walked back a sustained-load write-up that claimed no drift or leak from a 15-second run, and listed the remaining gaps in the architecture doc: no rate limiter, no LRU eviction, no structured logging.",
      },
    ],
    stack: [
      { group: "Runtime", items: ["llama.cpp", "llama-cpp-python (ctypes)", "Python 3.11", "asyncio"] },
      { group: "Scheduling", items: ["Continuous batching", "Chunked prefill", "FIFO / Priority / WFQ"] },
      { group: "Prefix cache", items: ["C++ radix tree", "flat C ABI", "CMake", "Python fallback"] },
      { group: "Serving", items: ["FastAPI", "SSE streaming"] },
      { group: "Observability", items: ["Prometheus", "Grafana", "OpenTelemetry", "py-spy"] },
      { group: "Quality", items: ["pytest", "mypy --strict", "ruff", "ctest", "Docker Compose"] },
    ],
    results: [
      "Admission backpressure verified under burst load: at 64 simultaneous requests, 42 were accepted and 22 rejected with 503 and Retry-After, matching the hand calculation of 128 KV blocks at 3 blocks per request.",
      "Scheduler fairness measured head to head (low/high-priority mean TTFT ratio): strict Priority 3.87×, WFQ 2.54×, FIFO 0.45×, so WFQ still favours high priority without starving the low class as hard.",
      "Prefix reuse on a shared-system-prompt workload: 47–70% of prompt tokens never reached llama_decode(), and TTFT p50 fell 1.4–1.9× across three paired runs. p95 showed no reliable effect and is reported that way.",
      "Aggregate throughput rose from 53.8 to 90.2 tok/s between 1 and 4 concurrent requests, then flattened to 96.1 at 16, exactly at the n_seq_max=4 slot limit (Qwen2.5-0.5B Q4_K_M on CPU).",
      "py-spy found 97.2% of wall time inside llama_decode(), in agreement with the server's own decode_step_duration_seconds metric (33.7 ms average decode); the ctypes batch fill costs under 2% of a full tick, so rewriting the Python layer in C++ was measured and rejected.",
      "Nine benchmark scripts with raw CSVs, a provisioned Grafana dashboard, and a native/Python prefix-cache pair held to identical behaviour by a 4000-op differential fuzz in CI.",
    ],
    lessons: [
      "Validate the riskiest architectural bet with a throwaway proof-of-concept before building the system around the assumption it depends on.",
      "Once batching is continuous, a scheduling policy has exactly one lever, which request claims a free slot. Describing it as more than that would misrepresent the code.",
      "Measure before choosing a language. The profiler said C++ would buy nothing on the hot path, so the C++ that did ship is there for portability into llama.cpp's own server, and the repo says so.",
      "A result that fails to show the expected effect is still a result if the mechanism is named. So is a 15-second run that cannot support a leak-freedom claim.",
    ],
    timeline: [
      { when: "Aug 2026", what: "Phases 0-1: bare execution loop against llama.cpp, then SSE streaming behind a single-consumer queue." },
      { when: "Aug 2026", what: "Phase 2: real multi-sequence continuous batching, KV block accounting and admission control, validated by a standalone POC first." },
      { when: "Aug 2026", what: "Phase 3: chunked prefill, FIFO/Priority/WFQ policies, cancellation and timeouts." },
      { when: "Aug 2026", what: "Phase 4: Prometheus metrics, OpenTelemetry tracing, a Grafana dashboard and a py-spy profiling session." },
      { when: "Aug 2026", what: "Benchmark suite and architecture docs; a check against the PRD added the missing queue-depth admission check." },
      { when: "Aug 2026", what: "Phase 5: prefix cache as a C++ radix tree with a Python fallback, plus a /demo page with live policy hot-swap." },
    ],
    links: [{ label: "GitHub", href: "https://github.com/CyberRik/tinyserve" }],
    demo: {
      youtube: "ruPoUDw6xg4",
      length: "0:45",
      poster: "/demos/tinyserve.jpg",
      blurb:
        "The real server running on llama.cpp with 2 decode slots: a burst of 16 requests streams through continuous batching, then the same 6 requests run under FIFO, Priority and WFQ, the scheduler hot-swapped on the live server between runs.",
      highlight: { at: 24, label: "FIFO vs Priority vs WFQ, on the same requests" },
      chapters: [
        { at: 0, label: "An LLM inference server on llama.cpp" },
        { at: 6, label: "A burst of 16 requests, 2 decode slots" },
        { at: 15, label: "Continuous batching — a finished stream hands its slot on" },
        { at: 24, label: "Compare policies: the same 6 requests" },
        { at: 30, label: "Scheduler hot-swapped on the live server" },
        { at: 36, label: "FIFO makes the pair wait; Priority skips; WFQ lets it past part of the line" },
      ],
    },
    related: ["ancora", "toolcalllm"],
  },

  /* ---------------------------------------------------------------- */
  senpai: {
    id: "senpai",
    title: "Senpai",
    tier: "featured",
    role: "Co-builder · team of 2",
    period: "May 2026 – Jul 2026",
    context: "Otsuka Corporation · Tokyo",
    tagline: "Sales copilot on Otsuka's SPR schema: deterministic deal health, grounded tool calling",
    milestone: "enterprise",

    overview:
      "A sales knowledge and onboarding copilot we built at Otsuka, anchored to the real shape of Otsuka's SPR sales data. A deterministic engine scores every deal on seven signals and explains each one; a self-hosted tool-calling model answers reps and managers by calling into that engine, hybrid retrieval and a deal graph, never by recalling facts on its own. The same health read that briefs a junior before a call flags a manager's dying deal.",
    problem:
      "Sales coaching is a judgement task built on records nobody has time to read: deal histories, activity logs, and what worked for comparable accounts. An assistant is the obvious shape for it, and also the dangerous one. A coaching answer that invents a win rate is worse than no answer, because it is confident, specific, and indistinguishable from a real one. So the constraint that shaped the system was that every number comes from code and every claim traces to a real record or a human-approved principle.",
    architecture: {
      summary:
        "A Next.js app talks to a FastAPI bridge over server-sent events. Before the model sees a turn, the bridge resolves the customer and deal in code (a deal picked from the selector is authoritative; an ambiguous name returns a picker instead of a guess) and pins the result into the prompt. Document goals branch to an LLMPlanner, which chooses only the set of capabilities to gather; entity IDs, edges and the fallback plan stay deterministic. Everything else runs a tool-selection loop against the served model: each batch of tool calls goes to an AdaptiveScheduler, which drops duplicates and turns the batch into a DAG where reads run in parallel and writes or external actions sit behind serialization barriers. A thread-pool ExecutionEngine runs that DAG against the SPR store and health engine, hybrid BM25 plus dense retrieval, and a networkx deal graph, and returns an append-only EvidenceBundle with citations; a failing tool degrades to an empty fragment rather than failing the run. The loop repeats until the model calls a finish tool, then a single synthesis round streams the answer. If every tool in the turn came back empty, a guard tells the model to say so instead of answering from memory.",
      diagram: {
        caption: "Senpai — one chat turn, from resolved entity to grounded answer",
        nodes: [
          { id: "web", label: "Next.js web app", sub: "Workspace · Review Coach", col: 0, row: 1, kind: "input" },
          { id: "bridge", label: "FastAPI bridge", sub: "SSE · entity resolution", col: 1, row: 1, kind: "core" },
          { id: "loop", label: "Tool-selection loop", sub: "finish tool · round cap", col: 2, row: 1, kind: "core" },
          { id: "planner", label: "LLMPlanner", sub: "goal → capability set", col: 2, row: 3, kind: "core" },
          { id: "model", label: "atlas-35b", sub: "NVFP4 · select, synthesise", col: 3, row: 0, kind: "model" },
          { id: "sched", label: "AdaptiveScheduler", sub: "dedup · write barriers", col: 3, row: 1, kind: "core" },
          { id: "engine", label: "ExecutionEngine", sub: "thread-pool DAG runner", col: 4, row: 2, kind: "core" },
          { id: "spr", label: "SPR store", sub: "deals · 7-signal health", col: 5, row: 1, kind: "store" },
          { id: "retrieval", label: "Hybrid retrieval", sub: "BM25 + dense, RRF", col: 5, row: 2, kind: "store" },
          { id: "graph", label: "networkx deal graph", sub: "44 segment reports", col: 5, row: 3, kind: "store" },
          { id: "answer", label: "Streamed answer", sub: "cited, token by token", col: 6, row: 0, kind: "output" },
        ],
        edges: [
          { from: "web", to: "bridge", label: "SSE" },
          { from: "bridge", to: "loop", label: "pinned entity" },
          { from: "bridge", to: "planner", label: "document goal" },
          { from: "loop", to: "model", label: "tools + finish" },
          { from: "loop", to: "sched", label: "tool_calls" },
          { from: "sched", to: "engine", label: "ExecutionPlan" },
          { from: "planner", to: "engine", label: "capability DAG" },
          { from: "engine", to: "spr" },
          { from: "engine", to: "retrieval" },
          { from: "engine", to: "graph" },
          { from: "engine", to: "loop", label: "EvidenceBundle" },
          { from: "model", to: "answer", label: "synthesis" },
        ],
      },
    },
    challenges: [
      {
        title: "Profiling before optimising: the double generation",
        body:
          "The system was correct but slow, and the obvious suspects were wrong. Instrumenting each component of a turn showed LLM generation was 98% of wall time; tool execution was 0.8% and retrieval about 1%. The cost was structural: selection ran with tool_choice=\"auto\", so when the model decided it needed no more tools it wrote the entire answer to say so, and synthesis then threw that away and wrote it again. An earlier estimate that blamed selection for 130s had lumped the discarded answer into the selection number.",
      },
      {
        title: "Two failed fixes before the finish tool",
        body:
          "Capping max_tokens on the selection round truncated long proposal tool calls, and llama-server started returning 500s on unparseable tool-call JSON. Streaming selection and aborting once prose began broke tools that narrate before calling. Both were reverted. What worked was a finish sentinel tool under tool_choice=\"required\": the model always emits a call, real or finish, so selection never writes a throwaway answer. Later we kept \"required\" only for the first round, because forcing it every round made the model pack its answer into a tool argument; a leak check now drops those calls.",
      },
      {
        title: "Grounding enforced in code, not in the prompt",
        body:
          "Segment intelligence partitions deals by product category and industry and computes every statistic in Python from the store and the health engine. The model only writes prose over those numbers, offline, and a gate extracts every number from that prose; if any is missing from the computed report, the prose is discarded for a templated sentence. The chat loop has a matching guard. When every tool in a turn returns nothing, the model is told to say what was not found, a fix for a turn that once answered a failed CRM lookup with GTA 6 specs from memory.",
      },
      {
        title: "Deciding what runs on which model, with data",
        body:
          "To test moving synthesis to a smaller model, we froze the post-tool context once and ran the identical context on each arm. A bf16 8B gave only 1.11×, because decode was bandwidth-bound and it moved about as many bytes per token as the Q4 27B. A Q4 8B gave 2.72× wall and 3.8× decode at grounding parity, with weaker coaching style. A prompt-engineering pilot that seemed to close the style gap at n=4 lost at n=8. The 8B emitted the right tool on only 2 of 5 selection probes, so selection stayed on the 27B.",
      },
      {
        title: "Serving on a shared GB10",
        body:
          "Models that had coexisted started hitting OOM, and nothing in ps or free explained it. nvidia-smi's compute-apps query showed another team's container holding about 93 GB of the 119 GB unified memory; once it was stopped, both our models fit with room to spare. When serving later moved to a single atlas-35b NVFP4 model, long answers degenerated into repetition loops (\"3. 3. 3.\"), which we traced to unset sampling: with no parameters it decoded greedily. Synthesis now runs at temperature 0.7 with explicit top-p and top-k, and tool selection stays near-greedy.",
      },
    ],
    stack: [
      { group: "Serving", items: ["llama.cpp llama-server", "atlas-35b (NVFP4)", "Qwen3 8B / 27B GGUF", "OpenAI-compatible client"] },
      { group: "Orchestration", items: ["AdaptiveScheduler", "ExecutionEngine (thread pool)", "LLMPlanner", "Finish-tool loop"] },
      { group: "Retrieval", items: ["BM25 (rank-bm25 + Janome)", "fastembed MiniLM", "RRF fusion", "networkx"] },
      { group: "App", items: ["FastAPI", "SSE", "Next.js 15", "React 19", "SQLite (WAL)", "python-pptx"] },
    ],
    results: [
      "Removed a wasted full generation per turn with the finish-tool loop; smoke-tested across all seven workflows with no 500s.",
      "Routing all synthesis to a Q4 8B cut the create_quote workflow from 334s to 152s; the frozen-context bench measured grounding parity (0.969 vs 0.969).",
      "Segment intelligence over 44 category × industry segments: 22 kept their gated LLM narrative, 22 fell back to the deterministic template, and no published figure comes from the model.",
      "Product recommendations grounded in a 9,826-page index of Otsuka's public site, including 3,285 product pages and 257 case studies, each chunk cited by URL.",
      "The pipeline War Room recomputes six months of weekly deal health and returns the replay in 143 ms, with no model in the path.",
    ],
    lessons: [
      "Profile before optimising, and distrust your own earlier numbers. The latency was never in tool execution or retrieval; it was one wasted generation per turn, hidden in a metric attributed to the wrong stage.",
      "When a model keeps doing something you don't want, remove the option rather than adding an instruction. Capping tokens and aborting streams policed the behaviour and failed; the finish tool made it unrepresentable.",
      "Grounding has to be mechanical. A model told not to invent statistics still will; one whose output is checked against a whitelist of computed numbers cannot publish them.",
      "Write down the experiments that failed, with their numbers. The 8B-for-everything idea looked good at n=4 and lost at n=8, and recording that is what stops it being proposed again.",
    ],
    timeline: [
      { when: "May 2026", what: "Joined Otsuka in Tokyo as SDE intern." },
      { when: "May – Jul 2026", what: "Built Senpai: deal-health engine, orchestration engine, grounded retrieval." },
      { when: "Jul 2026", what: "Latency work landed: finish-tool loop and the frozen-context model split." },
    ],
    links: [
      { label: "GitHub", href: "https://github.com/CyberRik/senpai" },
      { label: "Resume", href: PROFILE.resumeUrl },
    ],
    related: ["toolcalllm", "gravton", "ancora"],
  },

  /* ---------------------------------------------------------------- */
  toolcalllm: {
    id: "toolcalllm",
    title: "ToolCallLM",
    tier: "featured",
    role: "Co-builder · team of 2",
    period: "May 2026 – Jul 2026",
    context: "Otsuka Corporation · Tokyo",
    tagline: "Function-calling model training — Qwen3-8B, QLoRA, BFCL evaluation",
    milestone: "enterprise",

    overview:
      "We fine-tuned Qwen3-8B for function calling on a single NVIDIA DGX Spark during an internship at Otsuka. The work ran as a loop of experiments: build a training blend from public tool-calling datasets and generated data, train a LoRA or QLoRA adapter, score it on the Berkeley Function-Calling Leaderboard (BFCL), and let the failure analysis pick the next blend. Single-turn calling reached 92–97% on BFCL's non-live categories. Multi-turn stayed hard, and much of the second half went into finding out why.",
    problem:
      "An 8B model learns the shape of a tool call quickly. The agent loop is harder: read a tool result, notice an error, and issue the one corrective call. BFCL scores multi-turn trajectories all-or-nothing, so one bad step zeroes the sample. The effects we were chasing were a few points wide, so every stage had to be measurable and every number reproducible.",
    architecture: {
      summary:
        "Each stage is a small Python module behind a thin script, driven by YAML configs that inherit from one base file, so an experiment is a config diff rather than a code change. The sources arrive in incompatible shapes (xLAM single-turn calls, ToolACE and ToolMind trajectories), so they are blended before preprocessing, then normalised into one Pydantic-validated schema and written as a single JSONL with turn-aware truncation to 8,192 tokens. Data from a Qwen2.5-72B teacher and from an executor-grounded recovery generator passes through the same validator, so the trainer never sees where a row came from. Training began on TRL's SFTTrainer with BF16 LoRA and moved to Unsloth with an NF4-quantised base once runs passed a day; in both, labels are built explicitly so only assistant tokens carry loss. Checkpoints are validated before resume (trainer state, adapter config and weights all present), and a heartbeat watchdog stops a stalled run gracefully before forcing an exit. For evaluation the adapter is merged into full weights and handed to the official bfcl CLI, which serves it through vLLM; our runner only builds the environment and collects scores, so a BFCL upgrade touches one file. A separate gold-history evaluator scores multi-turn tasks one step at a time with perfect history, and its gap against the rollout score, read with the failure taxonomy, is what chose the next dataset.",
      diagram: {
        caption: "ToolCallLM — data blend to diagnosed checkpoint, and the loop back into data",
        nodes: [
          { id: "public", label: "Public FC datasets", sub: "xLAM · ToolACE · ToolMind", col: 0, row: 0, kind: "input" },
          { id: "teacher", label: "Teacher LLM", sub: "Qwen2.5-72B-AWQ", col: 0, row: 1, kind: "model" },
          { id: "recovery", label: "Recovery generator", sub: "executes real BFCL APIs", col: 0, row: 2, kind: "core" },
          { id: "blend", label: "Blend + preprocess", sub: "diversity mix, validate", col: 1, row: 1, kind: "core" },
          { id: "base", label: "Qwen3-8B", sub: "frozen base, BF16 or NF4", col: 2, row: 0, kind: "model" },
          { id: "jsonl", label: "train.jsonl", sub: "~50K rows, 8192-token cap", col: 2, row: 1, kind: "store" },
          { id: "sft", label: "SFT trainer", sub: "TRL LoRA, Unsloth QLoRA", col: 3, row: 1, kind: "core" },
          { id: "ckpt", label: "checkpoint-N", sub: "validated before resume", col: 4, row: 1, kind: "store" },
          { id: "bfcl", label: "BFCL harness", sub: "merge, vLLM, AST check", col: 5, row: 1, kind: "core" },
          { id: "gold", label: "Gold-history eval", sub: "teacher-forced step acc", col: 5, row: 2, kind: "core" },
          { id: "scores", label: "summary.json", sub: "per-category accuracy", col: 6, row: 0, kind: "output" },
          { id: "diag", label: "Failure analysis", sub: "taxonomy, step-acc gap", col: 6, row: 2, kind: "output" },
        ],
        edges: [
          { from: "public", to: "blend" },
          { from: "teacher", to: "blend", label: "clarify, abstain" },
          { from: "recovery", to: "blend", label: "error arcs" },
          { from: "blend", to: "jsonl" },
          { from: "base", to: "sft" },
          { from: "jsonl", to: "sft", label: "assistant-only" },
          { from: "sft", to: "ckpt", label: "adapter" },
          { from: "ckpt", to: "sft", dashed: true, label: "resume auto" },
          { from: "ckpt", to: "bfcl", label: "merged" },
          { from: "ckpt", to: "gold" },
          { from: "bfcl", to: "scores" },
          { from: "bfcl", to: "diag" },
          { from: "gold", to: "diag" },
          { from: "diag", to: "recovery", dashed: true, label: "next blend" },
        ],
      },
    },
    challenges: [
      {
        title: "The loss was being computed on the wrong tokens",
        body:
          "Early runs used full-sequence causal loss, so gradients flowed through system prompts, tool schemas and tool results, and on tool-heavy examples those tokens dominated. Underneath sat a quieter bug: the pad token aliased EOS, and the collator masks labels wherever input matches the pad id, so turn terminators dropped out of the loss exactly where truncated JSON was the observed failure. We switched to response-only masking through the chat template's generation markers, explicit -100 labels outside assistant spans, and a dedicated pad token. Checkpoints from before the fix optimised a different objective, so we discarded those comparisons instead of reinterpreting them.",
      },
      {
        title: "Single-turn training erased multi-turn",
        body:
          "The xLAM-only control run lifted single-turn to an 85.95% average and drove multi-turn from the base model's 32% to 0.25%, because xLAM has no examples of continuing after a tool result. Blending in 40% ToolACE trajectories, picked by diversity sampling against an xLAM coverage report (new tool domains, deeper conversations, error-recovery turns), brought multi-turn back to 19.5% with single-turn at 86.63%. Negative examples, ordinary chat with irrelevant tool schemas injected, taught the model that a visible tool is not an instruction to call it.",
      },
      {
        title: "Telling a bad policy from compounding errors",
        body:
          "Five experiments left multi-turn BFCL between roughly 10% and 34%, and a rollout score cannot say whether the model picks wrong steps or fails to recover from its own. We built a teacher-forced evaluator that feeds the gold history up to each turn and scores that turn alone with BFCL's state checker: step accuracy was 53–69% against rollout scores of 13.5–34%, a 30–43 point gap in every category. An audit of the blend explained it. After a tool error, only 26.0% of next turns issued a corrected call, while 74% narrated or gave up, so we wrote a recovery generator that executes the real BFCL backend classes rather than letting an LLM invent tool results.",
      },
      {
        title: "Runs measured in days on one GB10",
        body:
          "BF16 LoRA runs on 40–50K rows at 8,192 tokens took 30–35 hours, so one bad run cost more than a day. Moving to Unsloth with an NF4 base and 8-bit AdamW freed memory, and group_by_length removed padding waste: an A/B on the same 256 rows measured 847.7 s against 399.8 s, a 2.12× speedup. A full run dropped to about 24 hours with no single-turn regression. Gradient checkpointing stayed on, because activations at batch 4 and 8,192 tokens measured around 87 GB without it.",
      },
      {
        title: "Measuring with the right harness",
        body:
          "Under BFCL's prompting handler the base model scored 0% on single-turn, because it answers in thinking-mode text rather than the call format that handler parses; under the function-calling handler the same weights score 95.25% on simple_python. Later, EXP5 was briefly scored with the wrong handler, which under-reported multi_turn_base by 12 points and miss_param by 13.5. The harness also classifies every failure (malformed versus truncated JSON, wrong tool versus hallucinated tool, missing versus invented arguments) and records the tool name and field path, so a drop traces back to examples instead of staying a count.",
      },
    ],
    stack: [
      { group: "Model", items: ["Qwen3-8B", "LoRA", "QLoRA (NF4)", "PEFT"] },
      { group: "Training", items: ["TRL SFTTrainer", "Unsloth", "Flash Attention 2", "W&B"] },
      { group: "Hardware", items: ["NVIDIA DGX Spark (GB10)"] },
      { group: "Data", items: ["xLAM-60k", "ToolACE", "ToolMind", "Qwen2.5-72B-AWQ teacher", "Pydantic"] },
      { group: "Evaluation & serving", items: ["BFCL v4", "vLLM", "FastAPI"] },
    ],
    results: [
      "Single-turn BFCL (EXP5, Unsloth NF4 QLoRA): 97.0% simple_python, 95.5% multiple, 93.0% parallel, 92.0% parallel_multiple. The base model under its function-calling handler already scores 95.25% on simple_python, so the single-turn gain is a few points.",
      "Multi-turn BFCL (EXP5): 34% base, 13.5% miss_func, 24% miss_param, 20% long_context, against the base model's 34%, 38%, 24% and 25%.",
      "Gold-history evaluation measured 53–69% per-step accuracy against 13.5–34% rollout scores, placing the multi-turn failure in compounding errors rather than per-step policy.",
      "Training time per full run cut from 30–35 hours to about 24, with group_by_length measured at 2.12× on identical rows.",
      // straight from the 2026-06-08 run log; see TRAINING_LOG below
      "EXP3 converged in one epoch over a 50,497-row blend: 1,434 steps, final eval loss 0.1256 at 96.0% eval token accuracy.",
      "A public replay of 12 real EXP3 transcripts, with the two misses left in.",
    ],
    lessons: [
      "Check what the loss is actually computed over before trusting any curve. Full-sequence loss on tool-heavy examples optimises conversation mimicry, and the training numbers look reasonable while it happens.",
      "Fix the harness before the model. A handler mismatch turned a 95% base model into 0%, and the same mistake later hid 12 points of multi-turn accuracy.",
      "Score steps, not only trajectories. All-or-nothing scoring hides whether a model is wrong or merely unrecovered, and those need opposite fixes.",
      "Audit what the data teaches after an error. Our blend modelled giving up nearly three times as often as recovering, and the model learned exactly that.",
    ],
    timeline: [
      { when: "May 2026", what: "Pipeline and baselines; xLAM-only control run, then the xLAM and ToolACE blend." },
      { when: "Jun 2026", what: "ToolMind blend, Unsloth NF4 QLoRA, gold-history step evaluation and recovery-data generators." },
      { when: "Jul 2026", what: "Wrap-up: a Japanese-language infographic summarising the experiments." },
    ],
    links: [
      { label: "GitHub", href: "https://github.com/CyberRik/tool-calling-bfcl" },
      { label: "Live demo", href: "https://huggingface.co/spaces/rik-labs/toolcalllm-replay" },
      { label: "Resume", href: PROFILE.resumeUrl },
    ],
    related: ["senpai", "medproqa"],
  },

  /* ---------------------------------------------------------------- */
  gravton: {
    id: "gravton",
    title: "Gravton — Crawler, Citations & Social Pipelines",
    shortTitle: "Gravton",
    tier: "featured",
    role: "AI Engineer",
    period: "Feb 2026 – May 2026",
    context: "Gravton Labs · Ontario, Canada (remote)",
    tagline: "The crawl, attribution and ingestion layer under a GEO visibility platform",
    milestone: "ai-infra",

    overview:
      "Gravton is an AI-search-visibility platform. It tells a brand how it shows up inside answers from ChatGPT, Perplexity, Claude, Gemini and Google AI Overviews. I built much of the data layer underneath it: the crawler that decides which of a brand's pages are worth fetching, the citation engine that turns the links inside model answers into brand-level metrics, and the Reddit, Quora and YouTube pipelines that bring community signal in. Later I moved that work onto Airflow and took the platform to production.",
    problem:
      "Both halves are selection problems that look like data problems. A crawler with a page budget spends it in whatever order URLs arrive, so it fills up on blog posts and misses the pricing and comparison pages that AI answers actually draw on. A citation is only useful once it is attributed to a brand, and attribution against a global brand list always matches something, which is worse than matching nothing.",
    architecture: {
      summary:
        "The production system splits a control plane from a work plane. Django owns business state (organisations, domains, brandkits, and one workflow row per run) and starts work through Airflow's REST API; Airflow runs the heavy stages as a chain of DAGs and reports back through a token-checked callback, so clients only ever poll Django. crawl_dag discovers URLs, scores and selects them against typed budgets, hands the selected set to an Apify actor and polls for the dataset, then enriches the pages and writes them to S3. Downstream DAGs build the brandkit and synthetic prompts, and responses_dag fans every prompt, model and generation out to Celery workers over Redis. Stages pass S3 artifact references instead of payloads, which keeps XCom bounded and lets a task on one container pick up output written on another. citation_dag then runs a strictly ordered sequence: extract citations from each answer's retrieved grounding, attribute source by domain ownership only, score support inside a per-row candidate map, weight by source type with log damping for repeated domains, and upsert on (response, page URL) so reruns are idempotent. Failure is explicit at each hop: a DAG failure callback marks the workflow failed in Django, and the Celery fan-out tolerates partial failure only up to a configured threshold. Before Airflow, the same crawler and citation logic ran as FastAPI services on Railway over Supabase, with the citation pipeline dispatched to Modal.",
      diagram: {
        caption: "Gravton — Django control plane, Airflow DAG chain, citation attribution",
        nodes: [
          { id: "django", label: "Django API", sub: "workflow state · REST", col: 0, row: 1, kind: "core" },
          { id: "crawl", label: "crawl_dag", sub: "discover · score · budget", col: 1, row: 1, kind: "core" },
          { id: "apify", label: "Apify actor", sub: "fetches selected URLs", col: 2, row: 0, kind: "input" },
          { id: "brand", label: "brandkit · prompt DAGs", sub: "competitors → prompts", col: 2, row: 1, kind: "core" },
          { id: "resp", label: "responses_dag", sub: "Celery fan-out · K gens", col: 3, row: 1, kind: "core" },
          { id: "llm", label: "LLM answer models", sub: "grounded generations", col: 4, row: 0, kind: "model" },
          { id: "cit", label: "citation_dag", sub: "extract · attribute", col: 4, row: 1, kind: "core" },
          { id: "social", label: "Social DAGs", sub: "Reddit · Quora · YouTube", col: 5, row: 0, kind: "input" },
          { id: "pg", label: "Postgres", sub: "prompt_citations · runs", col: 5, row: 2, kind: "store" },
          { id: "insights", label: "Insights metrics", sub: "share · rank · trend", col: 6, row: 1, kind: "output" },
        ],
        edges: [
          { from: "django", to: "crawl", label: "dagRuns API" },
          { from: "crawl", to: "apify", label: "trigger · poll", dashed: true },
          { from: "crawl", to: "brand", label: "S3 keys" },
          { from: "brand", to: "resp", label: "prompts" },
          { from: "resp", to: "llm", label: "prompt × model" },
          { from: "resp", to: "cit", label: "S3 artifacts" },
          { from: "cit", to: "pg", label: "upsert" },
          { from: "pg", to: "insights" },
          { from: "social", to: "insights", label: "authority" },
          { from: "crawl", to: "django", label: "status callback", dashed: true },
        ],
      },
    },
    challenges: [
      {
        title: "Candidate starvation and attribution leakage",
        body:
          "Rows reached enrichment with an empty candidate map, so they could never be attributed, and support attribution ran before the map existed, scoring against the global known-brands set. The fix was ordering plus a layered fallback: build the map first, filling it from ambiguous candidates, alias hits, content matches, domain and URL tokens, and finally the run's active competitors, then score support only inside it. Source attribution was narrowed to domain ownership, because snippet, token and content paths had been assigning brands to pages those brands don't own. 'No content' and 'weak candidates' became separate failure modes, since they need different fixes.",
      },
      {
        title: "Spending a crawl budget on the right pages",
        body:
          "A flat page cap produces a blog-heavy corpus, because blogs are what most sites have most of. Typed budgets fix the distribution: per-type slots for pricing, product, use-case, integrations, docs and comparison pages, drained from a ranked list, with a per-prefix diversity cap so one URL subtree can't consume a category. Ranking before the fetch means quality is decided before spend rather than filtered after it.",
      },
      {
        title: "Zero-page crawls, diagnosed on paper first",
        body:
          "Crawls were returning zero pages classified as queue_exhausted, and neither the queue nor the pool explained it alone. I wrote a read-only audit of the browser, context and page pools, the priority queue and both retry layers before changing anything. It showed the seed URL was a single point of failure: every attempt drained the pool, so the first fetch paid a cold browser start against a 20-second acquire timeout, and a failed seed ended the crawl with nothing queued. The fixes followed from that: warm the pool after a drain with one retry on a crashed browser, split queue_exhausted into specific seed failures (WAF, empty root, navigation, redirect mismatch), and cut the pool from 100 contexts and 250 pages to 20 and 25.",
      },
      {
        title: "Three social platforms, one authority contract",
        body:
          "Reddit, Quora and YouTube disagree about what a post is and what engagement means, and three bespoke pipelines would leave nothing downstream able to compare them. Each became a Django app behind its own Airflow DAG, but all three converge on the same two contracts: a deterministic authority score over five weighted signals summing to 1.0, and entity-mention answer units exposed read-only to the insights DAG. The weights differ where the signals do (subscribers carry 0.30 on YouTube and 0.20 on Reddit, where engagement carries more), and every component score stays explainable rather than being a model output nobody can defend.",
      },
      {
        title: "Auditing a migration instead of trusting it",
        body:
          "When the pipeline moved from the Railway services into Airflow DAGs, the execution shell and basic enrichment came across, but discovery, scoring and typed budgeting largely did not. I audited it against the original as the truth source and scored completeness at 38%, with the five missing layers ranked, which is more useful to hand someone than 'mostly migrated'. The metrics needed the same treatment, because the gaps there were silent: competition ranking with ties had become positional enumeration, and citation share had moved from a 0–100 percentage to a 0–1 fraction.",
      },
    ],
    stack: [
      { group: "Backend", items: ["Django REST", "FastAPI", "Railway", "Supabase", "PostgreSQL"] },
      { group: "Pipelines", items: ["Airflow", "Celery", "Redis", "Modal", "S3 artifacts"] },
      { group: "Crawling", items: ["Playwright", "Apify", "Browser pooling"] },
      { group: "Extraction", items: ["YAKE", "Page-type classification"] },
      { group: "Sources", items: ["Reddit", "Quora", "YouTube"] },
      { group: "Infra", items: ["Docker Compose", "Traefik", "Gunicorn", "nginx"] },
    ],
    results: [
      "Primary engineer on the citation attribution engine: extraction normalised across 5 LLM provider families (OpenAI, Anthropic, Gemini, Perplexity, xAI) plus Google AI Overviews behind one registry, gated on retrieved grounding so ungrounded URLs never score.",
      "Sole author of the Reddit, Quora and YouTube intelligence pipelines: three Django apps behind their own Airflow DAGs (YouTube alone is 17 tasks), with deterministic 5-signal authority scoring and read-only answer-unit contracts downstream.",
      "Built the crawler's discovery, scoring, selection and budgeting layers: sitemap and DOM discovery, an adaptive pass, Apify fallback, canonical dedupe with locale normalisation and robots gating, and typed slot allocation.",
      "Implemented the citation metric set behind the Insights Engine: mass-weighted brand share with the unattributed bucket excluded from the denominator, competition-ranked position, per-model availability, and domain, page and daily-trend tables.",
      "Cut the crawler's browser pool 5–10× (100 contexts and 250 pages down to 20 and 25) after auditing zero-page crawls, and added pool warm-up and specific seed-failure classifications.",
      "Drove the Airflow migration and took the platform to production: containerised the Django, Celery and Airflow stack, moved crawl, enrich and citation stages onto DAGs with idempotent persistence, then hardened the deploy with Gunicorn, a locked-down Traefik, internal services off the host network and request-time nginx upstream DNS.",
      "Ported the crawler and insights services from Encore TypeScript to FastAPI on Railway over Supabase, dispatching heavy stages to Modal serverless. Both platforms run in production.",
      "Closed a cross-brand-set data leak that surfaced out-of-scope competitors in customer-facing citation results.",
    ],
    lessons: [
      "Ordering is a correctness property, not a performance one. Candidate starvation wasn't a scoring bug; the scorer was fine, it just ran before the data it needed existed.",
      "Constrain the search space before you score it. Attribution against a global brand set always finds something. Attribution scoped to a candidate map can honestly return nothing, and that is what makes its matches worth anything.",
      "Grade a migration against the original, metric by metric. 'It runs' and 'it agrees with what it replaced' are different claims, and only the second is worth making.",
      "Write the audit before the fix. Zero-page crawls looked like a capacity problem; reading the pool and queue end to end showed a single fragile seed fetch, which turned a guess-and-retune loop into a few targeted changes.",
    ],
    timeline: [
      { when: "Feb 2026", what: "Joined Gravton Labs as AI Engineer intern; moved the crawler in and got it running end to end." },
      { when: "Feb – Mar 2026", what: "Crawler discovery, URL scoring, typed crawl budgeting and the pool audit." },
      { when: "Mar – Apr 2026", what: "Citation attribution: candidate map, scoped scoring, failure taxonomy, metrics and endpoints." },
      { when: "Apr – May 2026", what: "Airflow migration and containerisation; metric parity audit; citation and crawl DAGs to production." },
      { when: "May 2026", what: "YouTube, Reddit and Quora intelligence pipelines; production deploy hardening." },
    ],
    links: [{ label: "Resume", href: PROFILE.resumeUrl }],
    related: ["tax-cpa-parser", "smartfan"],
  },

  /* ---------------------------------------------------------------- */
  "tax-cpa-parser": {
    id: "tax-cpa-parser",
    title: "Tax CPA Parser",
    tier: "featured",
    role: "Primary Engineer",
    period: "Oct 2025 – Dec 2025",
    context: "OctonData · San Francisco (remote)",
    tagline: "Document intelligence for variable tax documents — 10K+ pages/month",
    milestone: "data-systems",

    overview:
      "A production document-intelligence service that turns a client's folder of tax paperwork into schema-checked JSON a CPA can review, at 10K+ pages a month. It sits behind a case-management app on GCP: the app takes uploads, the processor parses, classifies and extracts each document, and the results come back by webhook. Tax paperwork is the hard case for parsing, because the same logical form arrives as a clean PDF, a phone photo or a scan, often bundled with other forms in one file.",
    problem:
      "CPA firms were reviewing every page by hand because no single extraction method survives real tax documents. A text-layer parser is fast but returns garbage on PDFs with broken font encodings. A vision model reads anything but is slow and costly to run on every page. And an LLM that can't see the data will still return a confident, well-formed answer.",
    architecture: {
      summary:
        "Two services, split so a slow parse never holds a web request. The case app (Flask on Cloud Run) writes uploads to Cloud Storage and a row to a processing_jobs table in Cloud SQL; that table is the only source of truth for where a document is. A scheduler worker polls every 30 seconds, posts pending jobs to the processor fire-and-forget with a callback URL, and a timeout sweep every two minutes moves stuck jobs back to retrying, up to three attempts. The processor (FastAPI, also on Cloud Run) routes each file by what it actually is: small PDFs take a local fast path, larger ones go through od-parse in 15-page chunks, and a PDF whose text comes back as CID codes or near-empty is re-read by Gemini vision, fast model first and the premium model only when a quality check fails. The markdown is PII-redacted, split at form boundaries when one file holds several forms, then sent to Gemini with a schema chosen by form type (W-2, 1040, 1040-NR, generic otherwise). Results land as JSON in Cloud Storage and a document row in Cloud SQL, and a webhook marks the job done. Anything that fails a guard is written out as a typed error artifact rather than as data.",
      diagram: {
        caption: "Tax CPA Parser — job lifecycle and per-document extraction path",
        nodes: [
          { id: "app", label: "CPA Co-Pilot API", sub: "Flask · uploads to GCS", col: 0, row: 1, kind: "input" },
          { id: "worker", label: "Job Worker", sub: "APScheduler · 3 attempts", col: 1, row: 1, kind: "core" },
          { id: "router", label: "Format Router", sub: "fast path · od-parse", col: 2, row: 1, kind: "core" },
          { id: "vision", label: "Tiered Vision OCR", sub: "2.0-flash → 2.5-pro", col: 3, row: 0, kind: "model" },
          { id: "split", label: "Form Splitter", sub: "PII redact · page bounds", col: 4, row: 1, kind: "core" },
          { id: "extract", label: "Gemini Extraction", sub: "schema per form type", col: 5, row: 1, kind: "model" },
          { id: "store", label: "Case Store", sub: "GCS JSON · Cloud SQL", col: 6, row: 0, kind: "store" },
          { id: "errors", label: "Error Artifact", sub: "typed, not data", col: 6, row: 2, kind: "output" },
        ],
        edges: [
          { from: "app", to: "worker", label: "processing_jobs" },
          { from: "worker", to: "router", label: "POST + callback" },
          { from: "router", to: "vision", label: "CID / empty text", dashed: true },
          { from: "router", to: "split", label: "markdown" },
          { from: "vision", to: "split", label: "page text" },
          { from: "split", to: "extract", label: "one form each" },
          { from: "extract", to: "store", label: "JSON" },
          { from: "extract", to: "errors", label: "placeholders", dashed: true },
          { from: "store", to: "app", label: "webhook", dashed: true },
        ],
      },
    },
    challenges: [
      {
        title: "Choosing the extractor per file, not per pipeline",
        body:
          "Every extractor had a document class it failed on, so the router decides per file and checks the output before trusting it. PDFs under 800 KB and six pages take a local fast path; larger ones go through od-parse, split into 15-page chunks above 50 pages. The output is then scanned for CID codes, the signature of a font the text layer can't decode. Those files are re-read by Gemini vision, which skips IRS instruction pages, tries gemini-2.0-flash first and escalates to gemini-2.5-pro only when word counts, CID ratio and tax patterns say the read was poor.",
      },
      {
        title: "A model that can't read the page invents a taxpayer",
        body:
          "When text extraction upstream failed, the LLM didn't return an error. It could return a well-formed record filled with John Doe, 123-45-6789 and other template values. The extraction step now checks responses for known placeholder values and raises a typed error instead of saving them. The error is written as its own JSON artifact next to the case's outputs, so a CPA sees a failed document, not a fake one.",
      },
      {
        title: "One upload, several forms",
        body:
          "Clients scan a W-2, a 1040 and its schedules into one PDF, and a single extraction call returns one muddled record. The processor detects form boundaries from page headers, keeps only boundaries scored at 0.65 confidence or above, and cuts the PDF into page ranges that are each parsed and extracted against their own schema. Instruction pages and segments too thin to be a real form are dropped before any model call.",
      },
      {
        title: "Rate limits reshaped the chunking strategy",
        body:
          "Gemini started returning 429s, and the cause was upstream of the API layer: chunking produced many small pieces and each piece was a call. The fix was a hard ceiling of three chunks per document, with chunk size doubling until the count fits. Semantic splitting moved to Chonkie on local all-MiniLM-L6-v2 embeddings, so chunking costs no API calls, with a 15-sentence minimum per chunk and a semaphore capping parallel calls. Recombining chunks became a per-type rule: invoice totals take the maximum because the same total repeats across chunks, bank statements concatenate transactions and medical records merge by date.",
      },
      {
        title: "Domain semantics that no general parser knows",
        body:
          "Documents were being filed under the wrong year, and the extraction was correct every time. A 1040 belongs to the tax year it's filed for. A W-2 for that tax year is issued the following calendar year and is filed under the issuance year. An identity document belongs to the year it was processed. The year became a per-document-type rule, with the original filename as a hint and a guaranteed fallback so a missing year can't block the pipeline.",
      },
    ],
    stack: [
      { group: "Document AI", items: ["od-parse", "PyMuPDF", "Tesseract", "Gemini 2.0 Flash / 2.5 Flash / 2.5 Pro", "Roboflow"] },
      { group: "Chunking", items: ["Chonkie", "all-MiniLM-L6-v2", "Gemini embeddings"] },
      { group: "Services", items: ["FastAPI", "Flask", "APScheduler", "Prefect", "LlamaParse", "CrewAI"] },
      { group: "Cloud", items: ["Cloud Run", "Cloud SQL (PostgreSQL)", "Cloud Storage", "Cloud Build", "Docker"] },
    ],
    results: [
      "10K+ pages processed per month, end to end.",
      "Onboarded 10+ U.S. CPA firms, cutting manual review time by 40%+.",
      "Long-document RAG accuracy up 20–30% via semantic, recursive and hybrid chunking.",
      "Extended od-parse, the in-house parser, from PDF/image to Excel, DOCX, PPTX and CAD vector formats behind a router with vector-vs-raster PDF triage, shipped as a Dockerized FastAPI service.",
      "Built od-parse's mechanical-drawing pipeline: Roboflow detection, batched Gemini multimodal verification in a single call per drawing, and a full-image rescan recovering annotations the detector missed.",
      "Grounded a CrewAI tax-analysis crew (return analyzer, IRS code researcher, strategy analyst) on the extracted case data.",
    ],
    lessons: [
      "Fix rate limits at the layer that causes them. The 429s looked like an API problem and were a chunking problem; retry logic alone would have made them slower and permanent.",
      "The dangerous failure is the plausible one. A placeholder taxpayer and an invoice total summed across chunks both look like real data, and nothing downstream flags either. Guards have to sit where the plausible-but-wrong value is produced.",
      "Domain rules don't appear in the data. Nothing in a W-2 says it belongs under its issuance year rather than its tax year; that came from understanding how firms actually work.",
      "Keep job state in one table and let everything else be stateless. With the processor fire-and-forget and a timeout sweep doing the retries, a crashed Cloud Run instance costs one retry, not a lost document.",
    ],
    timeline: [
      { when: "Oct 2025", what: "Joined OctonData as primary engineer on document intelligence." },
      { when: "Oct – Dec 2025", what: "Hybrid parsing pipeline and chunking strategies." },
      { when: "Dec 2025", what: "10+ CPA firms onboarded in production." },
    ],
    links: [{ label: "Resume", href: PROFILE.resumeUrl }],
    related: ["gravton", "medproqa"],
  },

  /* ---------------------------------------------------------------- */
  reach: {
    id: "reach",
    title: "R.E.A.C.H.",
    tier: "featured",
    role: "Co-founder · team of 5",
    period: "Apr 2025 – Aug 2026",
    context: "IITM Nirmaan cohort",
    tagline: "Emergency response platform — a Whisper fine-tune for telephony-band audio, and a voice path that degrades without losing the report",
    milestone: "building",

    overview:
      "An emergency response platform we started as a five-person team in the IITM Nirmaan cohort and then built out as working code: a live incident map, responder tracking over Socket.IO on OSRM routes, EXIF screening of bystander photos, and a voice-report path. Spoken reports are transcribed by reach-asr, a separate service running whisper-base with a LoRA adapter fine-tuned for telephony-band noisy speech. The fine-tune is measured as a full 2×2 against the zero-shot model with paired bootstrap intervals, and the evaluation ships with an audit of its own methodology.",
    problem:
      "Dispatch depends on someone parsing a distressed caller in real time, and stock speech models are trained mostly on clean read speech. The obvious fix, training on real emergency calls, is not available: 911 recordings are legally restricted almost everywhere and no public corpus exists. So the acoustic condition has to be constructed from public corpora, named as constructed, and the gain measured against a baseline on identical utterances. The platform around the model carries a matching constraint: a transcription outage must never cost a responder the report itself.",
    architecture: {
      summary:
        "Three independent paths share one Next.js app, split by what each needs from its runtime. On the voice path, VoiceReport records up to 30 s with MediaRecorder, creates a blob URL for the clip before uploading it, and posts it to /api/transcribe, which forwards it to reach-asr under a 20 s abort. reach-asr is a FastAPI process that loads whisper-base at startup, merges the LoRA adapter into the base weights, and serialises requests through a semaphore of one, running generate() on a worker thread so /health keeps answering while the GPU is busy. It sits outside Next.js because a resident ~290 MB model wants a GPU for the process lifetime, the opposite shape from a route handler that scales to zero. Failures are mapped at the boundary: bad audio stays a 422, any other upstream error becomes a 502, and a timeout or unreachable service becomes a 503 marked degraded, while in every case the recording still lands in the incident feed, playable. Tracking runs on a separate Express and Socket.IO server: a client joins an incident room, the server fetches a driving route from the public OSRM router, interpolates ten points per segment, slows on sharp turns, and emits position and bearing to the room, clearing the timer when the last client leaves. Bystander photos go through /api/verify-media, which reads EXIF GPS with exifr and flags anything more than 3 km (Haversine) from the claimed location, accepting when metadata is missing. The incidents themselves are seeded mock data relocated to the user's GPS fix and the tracked responder is simulated; neither is a live dispatch feed.",
      diagram: {
        caption: "R.E.A.C.H. — voice report, responder tracking and photo screening as three separate paths",
        nodes: [
          { id: "mic", label: "VoiceReport", sub: "MediaRecorder · 30 s cap", col: 0, row: 0, kind: "input" },
          { id: "route", label: "/api/transcribe", sub: "Next.js · 20 s abort", col: 1, row: 0, kind: "core" },
          { id: "serve", label: "reach-asr", sub: "FastAPI · semaphore(1)", col: 2, row: 0, kind: "core" },
          { id: "whisper", label: "whisper-base + LoRA", sub: "adapter merged at load", col: 3, row: 0, kind: "model" },
          { id: "blob", label: "Recording blob", sub: "created before upload", col: 1, row: 1, kind: "store" },
          { id: "feed", label: "Incident feed", sub: "EventModal transcript", col: 4, row: 1, kind: "output" },
          { id: "join", label: "ResponderLoc", sub: "socket.io-client", col: 0, row: 3, kind: "input" },
          { id: "tracker", label: "Tracking server", sub: "Express + Socket.IO", col: 1, row: 3, kind: "core" },
          { id: "osrm", label: "OSRM public router", sub: "driving polyline", col: 2, row: 2, kind: "input" },
          { id: "marker", label: "Responder marker", sub: "Leaflet · incident room", col: 3, row: 3, kind: "output" },
          { id: "submit", label: "/submit", sub: "photo + claimed location", col: 0, row: 4, kind: "input" },
          { id: "verify", label: "/api/verify-media", sub: "exifr · Haversine 3 km", col: 1, row: 4, kind: "core" },
        ],
        edges: [
          { from: "mic", to: "route", label: "multipart" },
          { from: "route", to: "serve", label: "POST /transcribe" },
          { from: "serve", to: "whisper", label: "to_thread" },
          { from: "whisper", to: "feed", label: "text" },
          { from: "mic", to: "blob" },
          { from: "blob", to: "feed", label: "always attached" },
          { from: "join", to: "tracker", label: "joinIncident" },
          { from: "tracker", to: "osrm", label: "route" },
          { from: "tracker", to: "marker", label: "position·bearing" },
          { from: "submit", to: "verify", label: "photo + lat/lng" },
        ],
      },
    },
    challenges: [
      {
        title: "The training condition had to be built, and said to be built",
        body:
          "No public corpus of real emergency-call audio exists, so we built the channel from stages that each model something specific: a 300–3400 Hz bandpass for the telephone passband, 8 kHz G.711 μ-law for the PSTN codec, ESC-50 noise from 15 emergency-relevant categories for the sirens and traffic behind a call, and packet loss over 20 ms frames, where Whisper tends to hallucinate fluent text across the gap. Source speech is LibriSpeech, and train and eval draw from disjoint noise clips so the model cannot memorise the sirens it is scored on. The claim that survives is \"fine-tuned for telephony-band noisy speech\", and it is the only one made.",
      },
      {
        title: "The first run got worse while its loss fell",
        body:
          "whisper-small on the milder default channel went from 5.52% to 11.89% WER while training loss fell from 1.82 to 0.71. The targets were raw LibriSpeech, all caps and unpunctuated, so the model spent its capacity learning a formatting change that the scoring normaliser then stripped; and that channel left only 2.5 points of headroom to recover. The fixes were to normalise training targets with the same EnglishTextNormalizer that scores them, and to measure headroom before training: a seven-minute probe showed a 19.2-point gap for whisper-base at −5 to 10 dB, which is what made the full run worth doing.",
      },
      {
        title: "Reporting the cell that hurts",
        body:
          "Clean zero-shot (4.37%) is the ceiling, degraded zero-shot (23.76%) the baseline, degraded fine-tuned (21.20%) the result. Without clean audio through the tuned model, \"learned phone audio\" and \"learned only phone audio\" are indistinguishable, so we ran it: 5.24%, a +0.87 pp regression. Both deltas carry 95% paired bootstrap intervals over 10,000 resamples, paired because both systems score byte-identical seeded audio, and neither interval contains zero. The fine-tune recovered 2.56 of the 19.39 points the channel cost, about 13% of the gap; in relative terms the trade inverts (−10.8% degraded against +19.9% clean), and both framings are reported.",
      },
      {
        title: "Auditing the evaluation, and finding it mislabelled",
        body:
          "degrade() measured SNR at 16 kHz full-band and only then band-limited and encoded the mix, so each manifest label described the audio before the channel rather than the file that was scored. Band-limiting moves speech and noise by different amounts, so at a labelled 10 dB the post-channel SNR ran from 2 dB (an in-band siren) to 33 dB (hiss above 4 kHz). The same audit measured the filter: the cascaded biquads put the flat band near 500–2500 Hz, not the documented 300–3400. The headline pair is untouched because the bootstrap never reads the SNR label; the per-bucket breakdown has to be rebuilt on post-channel, active-speech SNR and is not quoted as a finding until it is.",
      },
      {
        title: "An inference outage must not delete someone's report",
        body:
          "The audio is the report and the transcript is an enrichment, so VoiceReport creates the blob URL before the upload is tried, and every failure branch (non-OK response, empty transcript, unreachable service, 20 s abort) still hands the recording up with failed: true. The route keeps the service's 422 distinct from an outage, so bad audio asks for a re-record while an outage never looks like the responder's mistake. A GET on the same route proxies the service's health check so the UI can say transcription is offline up front; recording is deliberately not gated on it. On the service side the model loads in the lifespan hook, so the process does not accept traffic it cannot yet serve.",
      },
    ],
    stack: [
      { group: "Speech", items: ["Whisper (whisper-base)", "LoRA / PEFT", "torchaudio", "EnglishTextNormalizer"] },
      { group: "Channel simulation", items: ["Bandpass 300–3400 Hz", "G.711 μ-law", "ESC-50 noise", "Packet loss"] },
      { group: "Evaluation", items: ["jiwer", "Paired bootstrap", "pytest", "Kaggle T4"] },
      { group: "Serving", items: ["FastAPI", "uvicorn", "ffmpeg decode", "Next.js route proxy", "MediaRecorder"] },
      { group: "Realtime & Maps", items: ["Express", "Socket.IO", "OSRM", "Leaflet / OpenStreetMap", "Overpass API"] },
      { group: "Media Verification", items: ["exifr", "Haversine geofencing"] },
    ],
    results: [
      "WER on telephony-band degraded audio cut from 23.76% to 21.20%: −2.56 pp, 95% CI [−3.85, −1.31] over 10,000 paired bootstrap resamples, with a LoRA (r=32, α=64 on q_proj/v_proj) over whisper-base, 2000 training and 300 eval utterances on a Kaggle T4.",
      "The specialisation cost measured rather than omitted: clean WER 4.37% → 5.24%, +0.87 pp, CI [+0.35, +1.40]. The model narrowed mildly; a LoRA that had collapsed onto the channel would put clean WER in the teens.",
      "Scored through Whisper's own EnglishTextNormalizer, so the numbers compare with the published model card rather than with a bespoke scoring function.",
      "49 tests that assert signal properties rather than that the code runs; one caught a single 2nd-order lowpass leaving ~10% of a 6 kHz tone standing.",
      "A self-audit found the per-utterance SNR labels were measured before the channel and scored after it, a labelled 10 dB spanning 2–33 dB in reality, and documented what that does and does not invalidate.",
      "A voice-report path that degrades without losing data: the recording reaches the incident feed whether transcription succeeds, times out at 20 s, or is unreachable.",
      "A map stack with no API keys or billing: OSM tiles, Overpass hospital search raced across three public mirrors with a 5-minute cache, and OSRM routing for the tracking simulation.",
      "EXIF-GPS screening of bystander photos against the claimed location within a 3 km Haversine tolerance, failing open on stripped or unreadable metadata.",
      "Selected from 200+ startups into the IITM NIRMAAN cohort as a five-person team.",
    ],
    lessons: [
      "When the real data is unobtainable, construct the condition and say so. \"Fine-tuned on emergency calls\" would not survive one question about the dataset; \"fine-tuned for telephony-band noisy speech\", with the four channel stages named, does.",
      "A falling loss measures the objective you set, not the one you meant. Only the split WER showed the first run was learning a formatting change instead of the channel.",
      "Measure the cell that makes the result look worse, and give every delta an interval. Without both, robustness and narrowing look the same, and a 300-utterance, one-seed delta is only a direction.",
      "Decide what is load-bearing and protect it in the control flow. The audio is the report, so the blob exists before the upload is tried and every failure path still carries it.",
    ],
    timeline: [
      { when: "Apr 2025", what: "Founded; selected into the IITM Nirmaan cohort." },
      { when: "2025", what: "First platform build: incident reporting, dispatch dashboard, responder flows." },
      { when: "Aug 2026", what: "Rebuilt dispatch/tracking on a fully free stack (Socket.IO, OSRM, Overpass, Leaflet); EXIF-based media verification with a fail-open rule." },
      { when: "Aug 2026", what: "reach-asr: telephony degradation pipeline, Whisper LoRA fine-tune and WER evaluation; voice-report flow wired into the incident modal with degraded-mode handling." },
      { when: "Sep 2026", what: "Paired bootstrap intervals, the 2×2 specialisation check, and an audit of the evaluation's own methodology." },
    ],
    links: [
      { label: "Resume", href: PROFILE.resumeUrl },
      { label: "GitHub — platform", href: "https://github.com/CyberRik/reach-app" },
      { label: "GitHub — reach-asr", href: "https://github.com/CyberRik/reach-asr" },
    ],
    related: ["indic-asr", "medproqa", "smartfan"],
  },

  /* ---------------------------------------------------------------- */
  "indic-asr": {
    id: "indic-asr",
    title: "Indic Speaker-Attributed ASR",
    tier: "featured",
    role: "Solo Developer",
    period: "Sep 2026",
    context: "Personal project · open source",
    tagline: "Who said what, across 9 Indic scripts: a diarization and ASR benchmark, and the two decode defects that dominated it",
    milestone: "current",

    overview:
      "A staged pipeline that diarizes multi-speaker Indic recordings, transcribes them, and assigns every word to a speaker, benchmarked on 12.26 hours of labelled YouTube audio across 9 scripts and 2–8 speakers. Three diarizers and three ASR systems are crossed on identical words, so a difference between two rows is a difference in one component, not in what each system happened to hear. The headline finding is that two decoding defects, not the models, set most of the error, and that one language-ID rule removed a further 6.71 cpWER points without making any recording worse.",
    problem:
      "Speaker-attributed ASR is usually reported as one number for one configuration, which hides whether the error is in recognition, in attribution, or in how the output was decoded. Indic audio makes this worse: the languages share acoustics but not scripts, so a system can hear the speech correctly and still score 100% WER by writing it in the wrong alphabet. Separating those causes needs a harness where exactly one thing changes between any two numbers.",
    architecture: {
      summary:
        "Each stage is a separate script, and the filesystem is the only interface between them: every system writes to its own directory (data/hyp/<diarizer>, data/asr/<asr>, data/attrib/<asr>__<diarizer>), so adding a system never touches the code downstream of it. ASR sees audio only and runs once per recording. IndicConformer is decoded in two passes over 30 s chunks with 2 s overlap: the first pass votes the language over every speech frame of the whole clip, the second decodes inside that language's block, and a word is kept only by the chunk whose core holds its midpoint. The language-ID fallback is emitted as a fourth ASR system rather than a special case, and a CPU-only attribution stage then labels each word with the diarizer turn it overlaps most, once per (ASR, diarizer) pair. Relabelling may only move whole units between existing speakers, and the projection back to RTTM keeps the diarizer's own turn boundaries and changes only labels, so missed speech and false alarm cannot move. Reference labels are read by the scorers and by diagnostics marked oracle, never by a model. The GPU stages checkpoint to append-only, fsync'd manifests that tolerate a truncated last line and retry anything not marked ok, so a dead Kaggle session costs the clip in flight; the scoring and report stages hold no state and rebuild from per-clip counts in seconds, so a metric bug never costs a GPU run. Each GPU stack has its own environment, because NeMo, pyannote, faster-whisper and onnxruntime-gpu pin conflicting numpy and cuDNN versions.",
      diagram: {
        caption: "Indic Speaker-Attributed ASR — stages joined only through per-system directories on disk",
        nodes: [
          { id: "audio", label: "Stage 1 · audio", sub: "yt-dlp → 16 kHz mono WAV", col: 0, row: 1, kind: "input" },
          { id: "diar", label: "Diarization", sub: "pyannote 3.1 · Sortformer", col: 1, row: 0, kind: "model" },
          { id: "asr", label: "Whole-clip ASR", sub: "IndicConformer · Whisper", col: 1, row: 2, kind: "model" },
          { id: "lid", label: "LID fallback", sub: "out-of-set → Whisper words", col: 2, row: 2, kind: "core" },
          { id: "attr", label: "Word → turn", sub: "max overlap · orphans kept", col: 3, row: 1, kind: "core" },
          { id: "relabel", label: "Relabelling", sub: "rule · Qwen2.5-7B 4-bit", col: 4, row: 3, kind: "model" },
          { id: "proj", label: "Turn projection", sub: "diarizer bounds · 0-edit ctl", col: 5, row: 3, kind: "core" },
          { id: "refs", label: "Stage 2 · references", sub: "RTTM + attributed text", col: 5, row: 4, kind: "store" },
          { id: "score", label: "Scorers + report", sub: "DER/JER · cpWER/WDER", col: 6, row: 0, kind: "output" },
        ],
        edges: [
          { from: "audio", to: "diar", label: "WAV" },
          { from: "audio", to: "asr" },
          { from: "diar", to: "attr", label: "turns" },
          { from: "diar", to: "score", label: "RTTM" },
          { from: "asr", to: "lid", label: "words + LID" },
          { from: "lid", to: "attr", label: "4 word sets" },
          { from: "attr", to: "score", label: "attributed words" },
          { from: "attr", to: "relabel", dashed: true, label: "units" },
          { from: "relabel", to: "proj", label: "word labels" },
          { from: "proj", to: "score", label: "RTTM" },
          { from: "refs", to: "score", dashed: true, label: "scorers only" },
        ],
      },
    },
    challenges: [
      {
        title: "A multi-softmax CTC head decoded as if it were one softmax",
        body:
          "IndicConformer scores each language in its own 256-token block with its own softmax, so logits from different blocks are not on one scale, and a global argmax spelled single words across six scripts at once. The fix was to vote for the recording's language over its speech frames and decode inside that block only. WER went from 93.66 to 78.82 with the same weights and the same audio. The naive decode is kept as a scored ablation, because the size of the gap is the evidence that the defect was real.",
      },
      {
        title: "A benchmark that returned a different answer every run",
        body:
          "faster-whisper's default temperature fallback samples without a seed, so one recording returned 87, 84 and 100 words on three identical runs. Pinning temperature to 0 returns 211 words every time. It also improved corpus WER from 86.62 to 85.70 and cut runtime from 396 to 153 minutes, so determinism cost nothing.",
      },
      {
        title: "A language-ID fallback, and the check that it wasn't fitted",
        body:
          "On 13 recordings IndicConformer's own vote chose Urdu or Nepali, and every word came out in the wrong script at 100% WER; spoken Hindi and Urdu differ mainly in script, so this is real acoustic ambiguity. The rule takes Whisper's words when the detected language is outside the ten served codes, and reads no reference. cpWER goes 79.67 → 72.96 with 12 recordings better, 87 unchanged and 0 worse, on all three diarizers. The counterfactual, routing clips detected as Hindi or Marathi to Whisper instead, makes corpus WER worse (82.56), so the gain is the rule and not a general preference for Whisper.",
      },
      {
        title: "Building the LLM relabeller, and reporting that it failed",
        body:
          "Relabelling from the transcript, after DiarizationLM, ran Qwen2.5-7B-Instruct in 4-bit over windows of 25 units, dropped edits below 0.7 confidence, discarded any recording where it tried to edit over 30% of units, and asserted per clip that the text never changed. It made cpWER worse (79.67 → 80.00) and WDER worse (20.12 → 20.96), with 6 recordings better against 19 worse. An oracle audit gives the mechanism: even after splitting at pauses over 0.5 s, 37.87% of words sit in units that span two true speakers, where no relabel can help.",
      },
      {
        title: "Scoring a word-level fix on a turn-level metric",
        body:
          "Relabelling edits words, but DER is measured over time, and turns rebuilt from word spans are shorter than the diarizer's, so DER would move for a reason unrelated to the edits. The projection keeps the diarizer's boundaries exactly and gives each turn the duration-weighted majority label of its words. Even with zero edits that already moves DER from 27.34 to 29.03, so the zero-edit projection is the control: against it the rule costs +1.52 DER and the LLM +0.87, and the results table prints the control beside every DER.",
      },
    ],
    stack: [
      { group: "Diarization", items: ["pyannote 3.1", "Sortformer 4spk-v1", "NeMo"] },
      { group: "ASR", items: ["IndicConformer-600M", "ONNX Runtime", "Whisper large-v3", "faster-whisper"] },
      { group: "Relabelling", items: ["Qwen2.5-7B-Instruct", "bitsandbytes 4-bit", "transformers"] },
      { group: "Metrics", items: ["pyannote.metrics", "MeetEval", "WDER", "rapidfuzz"] },
      { group: "Pipeline", items: ["Python", "yt-dlp", "ffmpeg", "Colab / Kaggle T4", "Append-only manifests"] },
    ],
    results: [
      "Benchmarked 3 diarizers × 3 ASR systems on 99 recordings (12.26 h, 9 scripts, 2–8 speakers, 7.61% overlapped speech) at collar 0 with overlap scored; pyannote 3.1 was best at DER 27.34 / JER 38.14, which a 0.25 s collar with overlap excluded would report as 20.58.",
      "Language-locked decoding of IndicConformer's multi-softmax CTC head took WER 93.66 → 78.82 and cpWER 94.15 → 79.67 on the same weights and audio.",
      "The language-ID fallback to Whisper cut WER to 71.71, cpWER 79.67 → 72.96 and WDER 20.12 → 9.32, with 12 recordings better, 87 unchanged and 0 worse under pyannote 3.1, and gains on all three diarizers.",
      "Devanagari WER fell 79.16 → 57.20, better than either system alone (Whisper 69.39), while routing in-set languages to Whisper made corpus WER worse (82.56).",
      "A deterministic Whisper decode (temperature 0) replaced 87/84/100 words across identical runs with 211 every time, moved corpus WER 86.62 → 85.70 and cut runtime from 396 to 153 minutes.",
      "LLM speaker relabelling was built, guarded and rejected on its own numbers (cpWER 79.67 → 80.00), with an oracle audit putting 37.87% of words beyond the reach of any relabel.",
      "cpWER sits under 1 point above WER, so recognition, not attribution, is the bottleneck; only 24% of pyannote's error seconds fall in overlapped speech.",
      "The end-to-end Colab notebook re-runs each model on a 3-recording subset and recomputes every CPU stage over all 99, reproducing 0.00% DER for all three diarizers and identical word sequences for all three ASR systems on different hardware.",
    ],
    lessons: [
      "Read a model's output contract before trusting its decode. A per-language softmax argmaxed globally produces confident nonsense, and 14.84 WER points sat behind that one assumption.",
      "Hold everything constant but one thing. Transcribing once and attributing per (ASR, diarizer) pair is what lets a cpWER difference be read as a labelling difference.",
      "A negative result needs a mechanism. The relabeller's failure is only useful because the oracle audit says why: 37.87% of words are in units no relabel could fix.",
      "Quote the strict number and print the lenient one beside it, and give every method its fair control. Both are what keep a benchmark figure comparable to someone else's.",
    ],
    timeline: [
      { when: "Sep 2026", what: "Six-stage diarization and ASR benchmark pipeline; reference cleaning and the metric policy." },
      { when: "Sep 2026", what: "Stage 5 relabelling (rule and LLM) plus the zero-edit DER projection control." },
      { when: "Sep 2026", what: "Language-ID fallback: IndicConformer, or Whisper when its own LID lands out of set." },
      { when: "Sep 2026", what: "End-to-end Colab notebook reproducing every committed table, and the write-up." },
    ],
    links: [
      { label: "GitHub", href: "https://github.com/CyberRik/indic-speaker-asr" },
      { label: "Write-up", href: "https://github.com/CyberRik/indic-speaker-asr/blob/main/WRITEUP.md" },
      { label: "Results table", href: "https://github.com/CyberRik/indic-speaker-asr/blob/main/data/results/results_table.md" },
    ],
    related: ["reach", "tinyserve", "toolcalllm"],
  },

  /* ---------------------------------------------------------------- */
  // Source: github.com/CyberRik/desi-agent — README results table and
  // results/*.json. A two-person build, credited jointly and written as
  // "we" at Ritankar's direction: the repo's R/F lanes and commit authors
  // don't reflect who did the work (much of the fine-tuning was his,
  // committed from the teammate's agent), so the site doesn't split it.
  "desi-agent": {
    id: "desi-agent",
    title: "Desi Agent",
    tier: "featured",
    role: "Co-builder · team of 2",
    period: "Nov 2026 – Present",
    context: "Lexsi AI Safety & Alignment Hackathon · Track 3",
    tagline:
      "A 3.35B banking agent for English, Hindi, Bengali, Hinglish and Banglish — task success 45.9% → 97.7%, above the 14B teacher it was distilled from",
    milestone: "current",

    overview:
      "Desi Agent is Cohere's Tiny Aya Global (3.35B), fine-tuned with AgentTune into a banking support agent that calls eight tools (balance, transactions, block card, dispute, UPI status, transfer, branch finder, loan EMI) for five ways of writing: English, Hindi, Bengali, Hinglish and Banglish. Stage 1 is LoRA distillation from a Qwen3-14B teacher. Stage 2 adds two rounds of rejection-sampling fine-tuning and a short multi-turn GRPO run aimed at the two weaknesses Stage 1 left. We built it as a team of two for Track 3 (Agentic Fine-tuning) of the Lexsi AI Safety & Alignment Hackathon 2026, from data generation to the live Lab.",
    problem:
      "Indian banking customers don't write \"please block my card\". They write \"mera card block kar do\", in Bengali script, or in Banglish, often without the card number. An agent acting on that has to pick the right tool, fill the arguments exactly, and ask when a detail is missing, because a wrong block_card or transfer_money is a real-world harm. The base model got 45.9% of held-out conversations right and took a wrong bank action in 20.8% of them.",
    architecture: {
      summary:
        "The design rests on one rule: labels come from code, and only the words come from a model. A scenario sampler decides the language, the task type and the exact gold tool calls, including cases that deliberately leave out a required detail. A deterministic mock bank (results derived from a SHA-256 hash of the arguments, schema-validated, errors returned rather than raised) executes those calls, and a Qwen3-14B-AWQ teacher on vLLM writes only the customer's message and the final reply. A teacher mistake can therefore make a sentence awkward but cannot make a label wrong. Episodes pass our script and language gates, CuratorKIT cleaning and dedup, and a yes/no checklist judge, then freeze into 1,937 train, 99 val and 486 test before any model sees them. AgentTune distils the train split into a LoRA (r=16, loss on assistant tokens only), with every row rendered by the same fmt.py that evaluation parses, so train and eval see identical text. One agent loop, fmt.run_episode, drives evaluation, GRPO rollouts and the demo alike: up to six steps, every call executed against the mock bank, malformed JSON recorded and fed back as an error. Because rollouts run through that loop, the Stage 2 reward is computed on exactly the behaviour the metrics later score.",
      diagram: {
        caption: "Desi Agent — labels from code, words from a teacher, one agent loop for eval, RL and demo",
        nodes: [
          { id: "sampler", label: "Scenario Sampler", sub: "code: intent · gold calls", col: 0, row: 1, kind: "input" },
          { id: "teacher", label: "Qwen3-14B Teacher", sub: "customer words + reply", col: 1, row: 0, kind: "model" },
          { id: "bank", label: "Mock Bank (tools.py)", sub: "deterministic, hashed", col: 1, row: 2, kind: "store" },
          { id: "splits", label: "Curated Splits", sub: "gates · dedup · judge", col: 2, row: 1, kind: "store" },
          { id: "sft", label: "AgentTune SFT", sub: "LoRA r=16 · T4×2 fp16", col: 3, row: 0, kind: "model" },
          { id: "rl", label: "RFT + GRPO", sub: "reward_lang · A100", col: 4, row: 0, kind: "model" },
          { id: "loop", label: "run_episode Loop", sub: "fmt.py · mock bank · ≤6", col: 5, row: 1, kind: "core" },
          { id: "metrics", label: "Metrics · AuditKIT", sub: "test · OOD · perturbed", col: 6, row: 0, kind: "output" },
          { id: "lab", label: "Desi Agent Lab", sub: "replays fp16 traces", col: 6, row: 2, kind: "output" },
        ],
        edges: [
          { from: "sampler", to: "teacher", label: "intent · lang" },
          { from: "sampler", to: "bank", label: "gold calls" },
          { from: "teacher", to: "splits", label: "words" },
          { from: "bank", to: "splits", label: "tool results" },
          { from: "splits", to: "sft", label: "train · val" },
          { from: "sft", to: "rl", label: "sampling policy" },
          { from: "splits", to: "loop", label: "frozen test" },
          { from: "rl", to: "loop", label: "adapter" },
          { from: "loop", to: "rl", dashed: true, label: "rollouts" },
          { from: "loop", to: "metrics" },
          { from: "loop", to: "lab", label: "traces" },
        ],
      },
    },
    challenges: [
      {
        title: "Making every label correct by construction",
        body:
          "Distilling tool calls from a teacher would teach the student the teacher's tool-calling mistakes. So the sampler builds the gold calls in code, the mock bank executes them, and the teacher only phrases the customer's message and the reply. 12% of training cases (27% of the test, which is balanced by task type) leave out a required detail, where the correct move is to ask. That split is why the 3B student ends up above the 14B teacher, which scores 67.5% on the same test.",
      },
      {
        title: "Keeping five ways of writing apart",
        body:
          "Reading the teacher's output was essential: two full generation runs were thrown away. In the first, 391 of 404 Banglish replies drifted into Hindi; in the second, a glossary line made the teacher write \"and dispute it\" in 444 episodes whose gold calls only block the card. Our gates now check script and language, that the reply talks to the customer, and that block and dispute references are quoted. CuratorKIT's 0–1 reward scores proved uncalibrated, so a yes/no checklist judge replaced them and removed 87 episodes. It does not reliably catch garbled code-mixed words, and the write-up says so.",
      },
      {
        title: "A 4.2× speed-up hiding in plain sight",
        body:
          "Training ran on a free Kaggle T4 ×2 (DDP, resumable across sessions via checkpoints on the Hub). torch.cuda.is_bf16_supported() returns True on a T4, but bf16 is emulated there: profiling showed 84% of GPU time in software bf16 matmuls. fp16 gave the same loss curve, and the SFT run finished in 2.2 hours.",
      },
      {
        title: "RL only where there is signal",
        body:
          "A GRPO probe on single-turn prompts found almost nothing to learn: 95.7% of samples already right, 12.7% of prompts with any reward difference. Trying the playground with a Banglish message followed by a Hinglish one exposed a failure no test measured: after a language switch, the SFT model answered in the new language only 38.3% of the time. There, 54.7% of prompts showed reward variance. Before optimising we audited the reward against scripted cheating policies, found that echoing the customer scored 0.77 of 1.30, and closed it in reward_lang. Two RFT rounds and 25 steps of GRPO followed.",
      },
      {
        title: "Well-formed mistakes now execute",
        body:
          "On 270 real BANKING77 messages the SFT model asks for missing details far more than the base model (80% vs 26%), but its guesses are well-formed, so 6.3% of unsafe actions go through, mostly block_card on an invented 1234. We answered on two layers. A grounding guard outside the model lets a block, dispute or transfer run only if its identifiers appear in the conversation; replayed on those traces it cuts executed unsafe actions to 0.4% and blocks none of the 170 correct state-changing calls in the test set. RFT round 2 then added 1,148 grounding examples, each paired with a control that does include the identifier.",
      },
    ],
    stack: [
      { group: "Models", items: ["Tiny Aya Global (3.35B)", "Qwen3-14B-AWQ teacher + judge", "Aya Expanse 8B (OOD rewording)", "LoRA (r=16)"] },
      { group: "Toolkits", items: ["AgentTune", "CuratorKIT", "AuditKIT"] },
      { group: "Data + eval", items: ["vLLM", "MinHash dedup", "LLM checklist judge", "Deterministic mock bank", "BANKING77"] },
      { group: "Train + ship", items: ["Kaggle T4 ×2 (DDP, fp16)", "Hugging Face Jobs (L40S, A100)", "Hugging Face Hub + Spaces", "llama.cpp (GGUF LoRA)"] },
      { group: "Quality", items: ["pytest", "uv", "GitHub Actions CI", "JSON run manifests"] },
    ],
    results: [
      "Stage 1 (SFT): task success 45.9% → 97.7% on 486 held-out test conversations (fp16, greedy, every tool call executed against the mock bank), above the 67.5% of the Qwen3-14B teacher it was distilled from.",
      "Wrong bank actions (block, dispute or transfer not exactly as asked) 20.8% → 1.8%; asking for missing details instead of acting 38.6% → 96.2%; two-step tasks 0.0% → 97.3%.",
      "Stage 2 (final GRPO adapter): right action in the right language after a language switch 34.0% → 74.7% (78.3% for the second seed), frozen test 98.4% with 1.4% wrong bank actions, and unsafe actions executed on BANKING77 requests without details 6.3% → 0.0%. That last number is partly in-distribution, since the English grounding rows came from BANKING77's train split. Nothing regressed at any step.",
      "GRPO cost 63 minutes on one A100 (about $2.60). On 300 paired switch conversations it fixed 26 that RFT 2 failed and broke 1 (McNemar p<1e-4).",
      "Out of distribution: on test messages reworded by a different model family and judge-validated (380 kept), the SFT model reaches 91.8% vs 49.7% for the base. Banglish (77.8%), Bengali (87.1%) and two-step tasks (85.5%) drop most.",
      "Not memorised and reads the receipt: success is flat across training-similarity quartiles (97.5 / 99.2 / 97.5 / 96.7%), 0 of 486 replies quote bank numbers not retrieved in that conversation (base: 20), and against a bank returning shifted values task success stays at 97.7%.",
      "Known failure, reported rather than hidden: 4 of the 11 remaining SFT test failures are the model inventing a card number (1234) and blocking it.",
    ],
    lessons: [
      "Take the labels from code and only the words from the teacher. Then a teacher mistake can make a sentence awkward but can't make a label wrong.",
      "Freeze the test split and fix the checkpoint rule (lowest validation loss) before training. Select on validation, never on test.",
      "Run training rollouts, evaluation and the demo through one agent loop. Then the reward, the metric and what a user sees cannot quietly disagree.",
      "Probe for learning signal and audit the reward for hacks before paying for RL. The failure worth optimising was found by using the demo, not by the test set.",
    ],
    timeline: [
      { when: "Nov 2026", what: "Contracts, mock bank tools, seed data and validator; teacher data generation across 5 languages, curation and frozen splits." },
      { when: "Nov 2026", what: "LoRA SFT via AgentTune on Kaggle T4 ×2, fp16 after profiling exposed emulated bf16; single-turn GRPO probed and set aside." },
      { when: "Nov 2026", what: "Evaluation harness and results for the base model, the 14B teacher and the fine-tuned agent." },
      { when: "Nov 2026", what: "Robustness checks (validated OOD rewording, a perturbed bank, memorisation by similarity, BANKING77), the grounding guard and the write-up." },
      { when: "Nov 2026", what: "Desi Agent Lab live on Hugging Face, replaying the scored test traces." },
      { when: "Nov 2026", what: "Stage 2: multi-turn language-switch eval, audited reward_lang, two RFT rounds and multi-turn GRPO on Hugging Face Jobs, two seeds." },
    ],
    links: [
      { label: "GitHub", href: "https://github.com/CyberRik/desi-agent" },
      { label: "Live demo", href: "https://huggingface.co/spaces/ToolW/desi-agent-lab" },
      { label: "Write-up", href: "https://github.com/CyberRik/desi-agent/blob/main/docs/ARTICLE.md" },
      { label: "Model", href: "https://huggingface.co/ToolW/desi-agent-tinyaya-sft-lora" },
      { label: "GRPO adapter", href: "https://huggingface.co/ToolW/desi-agent-tinyaya-grpo-mt-lora" },
    ],
    related: ["toolcalllm", "indic-asr", "reach"],
  },

  /* ---------------------------------------------------------------- */
  medproqa: {
    id: "medproqa",
    title: "MedProQA",
    tier: "archive",
    role: "Solo Developer",
    period: "Jul 2025",
    context: "Personal project",
    tagline: "QLoRA fine-tune of Phi-3.5 Mini for clinical multiple-choice questions",
    milestone: "building",

    overview:
      "A LoRA fine-tune of Phi-3.5 Mini Instruct for clinical multiple-choice reasoning, built for the Goedel Machines x IITM Clinical LLM Challenge. The base model is loaded in 4-bit, a small adapter is trained on the challenge's easy and medium question sets, and a separate notebook re-attaches that adapter to produce the submission file. It was a first pass through the whole fine-tuning loop on Kaggle hardware, and its most useful output is what it taught about that loop.",
    problem:
      "The challenge ships clinical MCQs in easy, medium and hard tiers and weights the hard tier highest (0.3 / 0.3 / 0.4). The model has to read a question and its lettered options and emit one letter. Everything ran inside Kaggle kernels with the base weights mounted as an input, so full fine-tuning was not an option and the training run had to fit one GPU.",
    architecture: {
      summary:
        "Training and inference are two separate notebooks joined only by an adapter checkpoint. In medical-llm.ipynb, Phi-3.5 Mini Instruct is loaded through bitsandbytes as NF4 4-bit with double quantisation and fp16 compute, prepared for k-bit training, and wrapped with a PEFT LoRA adapter (r=16, alpha 32, dropout 0.05) on the attention projections qkv_proj and o_proj only. The data side concatenates train_easy and train_medium, takes the first 64,000 rows, renders each as a \"Question / Choices / Answer:\" prompt with the answer letter appended, tokenises to 256 tokens, and splits 90/10 into 57,600 training rows and 6,400 held out. The Hugging Face Trainer runs 2 epochs at batch 2 with 8-step gradient accumulation (7,200 steps), fp16 and gradient checkpointing, saving every 500 steps and keeping the last two. State lives only in those checkpoints: checkpoint-6500 holds the adapter weights plus optimizer, scheduler and RNG state, so a run can resume rather than restart. submission.ipynb reloads the base model in fp16 instead of 4-bit, attaches the adapter with PeftModel, generates up to 10 new tokens per question, maps the output to an option letter (falling back to A), and writes submission.csv as id to answer.",
      diagram: {
        caption: "MedProQA — 4-bit LoRA training, then adapter-only inference in a second notebook",
        nodes: [
          { id: "base", label: "Phi-3.5 Mini Instruct", sub: "Kaggle model input", col: 0, row: 0, kind: "model" },
          { id: "data", label: "Challenge JSONL", sub: "train_easy + train_medium", col: 0, row: 1, kind: "input" },
          { id: "nf4", label: "bitsandbytes NF4", sub: "4-bit · double quant", col: 1, row: 0, kind: "core" },
          { id: "prompt", label: "Prompt + tokenise", sub: "MCQ template · 256 tok", col: 1, row: 1, kind: "core" },
          { id: "lora", label: "PEFT LoRA r=16", sub: "qkv_proj · o_proj", col: 2, row: 0, kind: "core" },
          { id: "held", label: "Held-out split", sub: "6,400 rows", col: 2, row: 2, kind: "store" },
          { id: "trainer", label: "HF Trainer", sub: "fp16 · grad checkpointing", col: 3, row: 1, kind: "core" },
          { id: "ckpt", label: "checkpoint-6500", sub: "adapter + optimizer state", col: 4, row: 1, kind: "store" },
          { id: "peft", label: "PeftModel", sub: "fp16 base + adapter", col: 5, row: 1, kind: "core" },
          { id: "csv", label: "submission.csv", sub: "id → answer", col: 6, row: 1, kind: "output" },
          { id: "score", label: "Weighted score", sub: "easy · medium · hard", col: 6, row: 2, kind: "output" },
        ],
        edges: [
          { from: "base", to: "nf4" },
          { from: "nf4", to: "lora" },
          { from: "lora", to: "trainer" },
          { from: "data", to: "prompt", label: "64,000 rows" },
          { from: "prompt", to: "trainer", label: "57,600 train" },
          { from: "prompt", to: "held", label: "10% split", dashed: true },
          { from: "trainer", to: "ckpt", label: "every 500 steps" },
          { from: "ckpt", to: "peft", label: "adapter" },
          { from: "peft", to: "csv", label: "≤10 new tokens" },
          { from: "peft", to: "score", label: "sample tests", dashed: true },
        ],
      },
    },
    challenges: [
      {
        title: "Fitting training on one GPU",
        body:
          "Full fine-tuning was out of reach, so the base model is quantised to NF4 4-bit at load time and only a rank-16 adapter on two attention projections is trained. A per-device batch of 2 with 8-step gradient accumulation gives an effective batch of 16, and fp16 plus gradient checkpointing keep activations small enough to fit.",
      },
      {
        title: "Turning MCQs into a generation target",
        body:
          "Each question is rendered as a fixed template, the lettered options listed one per line, and the answer letter appended after \"Answer: \". That turns classification into next-token prediction the instruct model already understands, and scoring reduces to comparing the first character after \"Answer:\".",
      },
      {
        title: "Long runs in a notebook session",
        body:
          "At 7,200 steps the run is long for one kernel session. The Trainer saves every 500 steps and keeps only the latest two, and each checkpoint carries optimizer, scheduler and RNG state, so training can resume where it stopped. The output directory is zipped so the adapter can be carried into the submission kernel as a Kaggle input.",
      },
      {
        title: "Separating training from inference",
        body:
          "The submission notebook never touches the training code. It reloads the base in fp16 and attaches only the adapter, which keeps the shipped artifact to a small set of LoRA weights and lets inference run without bitsandbytes on the T4 the kernel was given.",
      },
    ],
    stack: [
      { group: "Model", items: ["Phi-3.5 Mini Instruct", "LoRA (PEFT)", "bitsandbytes NF4"] },
      { group: "Training", items: ["PyTorch", "Hugging Face Transformers", "Trainer", "Datasets", "Accelerate"] },
      { group: "Runtime", items: ["Kaggle notebooks", "Tesla T4"] },
    ],
    results: [
      "QLoRA adapter trained to step 6,500 of a scheduled 7,200 (epoch 1.81 of 2) on 57,600 clinical MCQs.",
      "Training loss fell from 1.069 at step 500 to 0.946 at step 6,500, logged every 500 steps.",
      "End-to-end submission path: adapter re-attached to the fp16 base and predictions written to submission.csv.",
      todo("challenge leaderboard or sample-test score — no evaluation output is recorded in the repo"),
    ],
    lessons: [
      "Check what the collator does to your labels. Preprocessing set every prompt token's label to -100 so only the answer would be learned, but DataCollatorForLanguageModeling(mlm=False) rebuilds labels from input_ids, so the masking never reached the loss. The prompt length was also measured with max_length padding, which always returns 256 and would have masked the answer too. The logged loss is over the whole sequence, not the answer letter.",
      "Inference has to see the prompt training saw. The submission notebook dropped the \"Question:\" and \"Choices:\" scaffolding, and it searched the decoded output, which includes the echoed prompt, for \"(A)\", \"(B)\" and so on. Decoding only the generated tokens with the training template would have made the predictions mean something.",
      "Wire evaluation in before the long run. A 6,400-row held-out split and a compute_metrics function exist, but neither was passed to the Trainer, so the run produced a loss curve and no accuracy. A held-out number per checkpoint would have caught both problems above within the first 500 steps.",
    ],
    timeline: [
      { when: "Jul 2025", what: "Trained the LoRA adapter and ran the submission notebook on a Kaggle T4 (18 Jul)." },
      { when: "Jul 2025", what: "Published notebooks and checkpoint-6500 to GitHub (27 Jul)." },
    ],
    links: [
      { label: "GitHub", href: "https://github.com/CyberRik/medproqa" },
      { label: "Resume", href: PROFILE.resumeUrl },
    ],
    related: ["toolcalllm", "reach"],
  },

  /* ---------------------------------------------------------------- */
  smartfan: {
    id: "smartfan",
    title: "SmartFan",
    tier: "archive",
    role: "Solo Developer",
    period: "Aug 2025",
    context: "Personal project",
    tagline: "n8n pipeline for fan-brand sentiment and share of voice",
    milestone: "building",

    overview:
      "A single n8n workflow that measures how four Indian fan brands (Atomberg, Havells, Crompton and Orient Electric) show up online. It pulls Flipkart review snippets, Google results, YouTube search results and tweets, classifies sentiment with a Gemini chat model, and turns the counts into share-of-voice and share-of-positive-voice figures. It was an early pass at the question Gravton later asked of AI answer engines: how visible is a brand, and in what tone.",
    problem:
      "Share of voice is easy to say and awkward to compute. Each source returns a different shape: SERP pages with organic results and product carousels, YouTube snippets, tweet objects. A brand comparison only holds if every brand goes through the same query, the same parsing and the same classifier, so the job was mostly about making the branches identical and the arithmetic explicit.",
    architecture: {
      summary:
        "One manual trigger fans out into nine parallel branches, so a run is a single snapshot taken at one moment. Four branches send the same query template ('<brand> smart fan reviews site:flipkart.com', India locale) through SerpAPI; a Code node pulls the result snippets out of the one SERP item and a second Code node splits them into one item per review, because n8n's Sentiment Analysis node classifies per item. That node is backed by a Gemini chat model and restricted to Positive, Neutral and Negative. The share-of-positive-voice node then counts positives and reads its denominator back from the extraction node by name, so the total is the number of snippets fetched rather than the number that came out of the classifier. The X branch feeds tweets straight into the same kind of classifier. Search visibility needs no model at all: three Google keywords ('smart fan', 'bldc fan', 'energy efficient fan') go to a JavaScript scorer that counts brand mentions, weights each organic hit by rank (10 minus its index), counts carousel products rated 4.0 or higher, and blends the three shares at 0.4, 0.3 and 0.3. Every node's output is pinned in the workflow and the headline numbers are written into sticky notes, so the export replays without API keys or search credits.",
      diagram: {
        caption: "SmartFan — nine parallel branches from one trigger to two share metrics",
        nodes: [
          { id: "trigger", label: "Manual Trigger", sub: "one run, nine branches", col: 0, row: 1.5, kind: "input" },
          { id: "x", label: "X search", sub: "'atomberg smart fan'", col: 1, row: 0, kind: "input" },
          { id: "flip", label: "SerpAPI · Flipkart", sub: "4 brands, same template", col: 1, row: 1, kind: "input" },
          { id: "google", label: "SerpAPI · Google", sub: "3 category keywords", col: 1, row: 2, kind: "input" },
          { id: "yt", label: "YouTube Data API", sub: "'smart fan', top 10", col: 1, row: 3, kind: "input" },
          { id: "split", label: "Snippet extract + split", sub: "one item per review", col: 2, row: 1, kind: "core" },
          { id: "serp", label: "SERP SoV scorer", sub: "mentions · rank · rating", col: 2, row: 2, kind: "core" },
          { id: "count", label: "Mention counter", sub: "brand in title or desc", col: 2, row: 3, kind: "core" },
          { id: "gemini", label: "Gemini sentiment", sub: "3 classes: pos · neu · neg", col: 3, row: 0.5, kind: "model" },
          { id: "sopv", label: "Share of positive voice", sub: "positives / items fetched", col: 4, row: 0.5, kind: "output" },
          { id: "sov", label: "Share of voice", sub: "weighted 0.4 · 0.3 · 0.3", col: 4, row: 2.5, kind: "output" },
          { id: "pin", label: "Pinned run data", sub: "pinData + sticky notes", col: 5, row: 1.5, kind: "store" },
        ],
        edges: [
          { from: "trigger", to: "x" },
          { from: "trigger", to: "flip" },
          { from: "trigger", to: "google" },
          { from: "trigger", to: "yt" },
          { from: "x", to: "gemini", label: "tweet text" },
          { from: "flip", to: "split", label: "SERP JSON" },
          { from: "split", to: "gemini", label: "reviewText" },
          { from: "google", to: "serp", label: "SERP JSON" },
          { from: "yt", to: "count", label: "snippets" },
          { from: "gemini", to: "sopv", label: "category" },
          { from: "serp", to: "sov" },
          { from: "count", to: "sov" },
          { from: "sopv", to: "pin", dashed: true },
          { from: "sov", to: "pin", dashed: true },
        ],
      },
    },
    challenges: [
      {
        title: "Keeping four brands comparable",
        body:
          "A comparison is only fair if each brand gets the same treatment. Every brand has its own branch, but the branches are identical: the same SerpAPI query template with gl=in and hl=en, the same snippet extraction, and the same three-class sentiment prompt. Only the brand name changes.",
      },
      {
        title: "Visibility is more than a mention count",
        body:
          "Counting how often a brand appears treats rank 1 and rank 10 as equal. The scorer tracks three signals per brand: mentions across organic results and the product carousel, a position score of 10 minus the result index, and carousel products rated 4.0 or higher. Each becomes a share of the four-brand total, and the shares are blended 0.4, 0.3 and 0.3 into one final figure.",
      },
      {
        title: "Turning one SERP response into classifiable items",
        body:
          "SerpAPI returns one item holding an array of results, and the Sentiment Analysis node classifies per item. Two small Code nodes bridge the gap. The first collects the snippets, the second emits one { reviewText } item for each. The scoring node then looks up the extraction node by name to get its total, so a snippet the classifier drops still counts in the denominator.",
      },
      {
        title: "Iterating on scoring without re-querying",
        body:
          "Every run spends SerpAPI and API quota, and the scoring code changed more often than the data needed to. Pinning each node's output in n8n froze one snapshot, so the JavaScript scorers could be edited and re-run against it. That same pinned data ships in the exported workflow.",
      },
    ],
    stack: [
      { group: "Orchestration", items: ["n8n", "Code nodes (JavaScript)", "HTTP Request node"] },
      { group: "Model", items: ["Google Gemini chat model", "n8n Sentiment Analysis node"] },
      { group: "Sources", items: ["SerpAPI (Google, Flipkart)", "YouTube Data API v3", "X (Twitter) API"] },
    ],
    results: [
      "Flipkart share of positive voice, ten review snippets per brand: Atomberg 100%, Havells 50%, Crompton 50%, Orient Electric 40%.",
      "Weighted Google share of voice for Atomberg: 42.46 on 'smart fan', 50.98 on 'bldc fan' and 61.67 on 'energy efficient fan'. It was the highest of the four brands on all three keywords.",
      "YouTube: 8 of the top 10 'smart fan' results mention Atomberg, an 80% share of voice.",
      "X: 2 of 5 tweets for 'atomberg smart fan' classified positive (40%).",
    ],
    lessons: [
      "The sample decides what a percentage means. Ten snippets per brand and five tweets make 100% describe one search page, not a market. The next step would have been paging through results before computing any share.",
      "A denominator should come from the data. The tweet total was patched by hand to match the five tweets returned. Counting the items that reached the node would have been both simpler and correct.",
      "The rank-weighted SERP score is the same question generative engine optimisation asks of AI answers: is the brand present, how prominently, and in what tone. Gravton took that question from search results to answer engines.",
    ],
    timeline: [
      { when: "Aug 2025", what: "Built the n8n workflow, ran all nine branches and pinned the results." },
      { when: "Aug 2025", what: "Published the workflow export, README and diagram to GitHub." },
    ],
    links: [
      { label: "GitHub", href: "https://github.com/CyberRik/smart-fan" },
      { label: "Resume", href: PROFILE.resumeUrl },
    ],
    related: ["gravton"],
  },

  /* ---------------------------------------------------------------- */
  rrt: {
    id: "rrt",
    title: "RRT Path Planning",
    tier: "archive",
    role: "Solo Developer",
    period: "Dec 2024 – Jan 2025",
    context: "Personal project",
    tagline: "2D RRT planning — three samplers and a smoothing pass, benchmarked",
    milestone: "foundations",

    overview:
      "An ID2090 course project at IIT Madras: a from-scratch Rapidly-exploring Random Tree planner in Python, with three sampling variants (basic, obstacle-spacing, goal-biased) and a shortcut smoother. Each variant was run 1000 times on the same map, and a Streamlit app lets you move obstacles and watch the paths change. It is the same class of planner as the vacuum bot roaming this room.",
    problem:
      "Basic RRT finds a path, but the path zigzags, hugs obstacle edges, and wanders before it reaches the goal. Each fix targets one of those faults. Telling whether a fix helps means running every variant against the same map, the same step size and the same collision check, many times over, because a single run of a randomised planner proves nothing.",
    architecture: {
      summary:
        "Everything sits on one substrate in rrt_utils.py: a Node with a parent pointer, a steer() that takes a fixed 10-unit step toward a sample, and an Environment that holds axis-aligned rectangular obstacles. Collision checking tests the whole segment between two nodes, not just the new point, using Cohen–Sutherland line clipping against each rectangle, so a step cannot jump through a thin wall. The three variants in rrt_variants.py differ only in the sampler: uniform over the map, uniform with samples rejected inside obstacles inflated by a spacing margin, or the goal itself with probability 0.2. Each iteration finds the nearest tree node by a linear scan, steers, keeps the node if the segment is clear, and stops once a node lands within 5 units of the goal. The path is then read back by following parent pointers. smooth_path() shortcuts it greedily, jumping from each waypoint to the farthest later one it can see in a straight line. The Streamlit front end builds the Environment from sidebar input, plots raw and smoothed paths with Matplotlib, and runs the benchmark loop, exporting results as CSV.",
      diagram: {
        caption: "RRT Path Planning — one sampling loop, three samplers, one shared collision check",
        nodes: [
          { id: "ui", label: "Streamlit sidebar", sub: "start · goal · obstacles", col: 0, row: 1, kind: "input" },
          { id: "env", label: "Environment", sub: "100×100 · rect obstacles", col: 1, row: 1, kind: "store" },
          { id: "sample", label: "Sampler", sub: "uniform · margin · goal 0.2", col: 2, row: 0, kind: "core" },
          { id: "steer", label: "Nearest + steer", sub: "linear scan · 10-unit step", col: 3, row: 0, kind: "core" },
          { id: "collide", label: "is_collision_free", sub: "Cohen–Sutherland clip", col: 3, row: 2, kind: "core" },
          { id: "tree", label: "Node tree", sub: "parent pointers", col: 4, row: 1, kind: "store" },
          { id: "smooth", label: "smooth_path", sub: "greedy shortcutting", col: 5, row: 0, kind: "core" },
          { id: "bench", label: "run_benchmark", sub: "1000 runs · CSV", col: 5, row: 2, kind: "output" },
          { id: "plot", label: "Matplotlib plot", sub: "raw vs smoothed", col: 6, row: 1, kind: "output" },
        ],
        edges: [
          { from: "ui", to: "env" },
          { from: "env", to: "sample", label: "margin check" },
          { from: "env", to: "collide", label: "obstacles" },
          { from: "sample", to: "steer", label: "point" },
          { from: "steer", to: "tree", label: "candidate" },
          { from: "collide", to: "tree", label: "accept / reject" },
          { from: "tree", to: "sample", label: "until within 5" },
          { from: "tree", to: "smooth", label: "path" },
          { from: "tree", to: "bench", label: "per-run stats" },
          { from: "tree", to: "plot", label: "raw path" },
          { from: "smooth", to: "plot" },
        ],
      },
    },
    challenges: [
      {
        title: "Checking segments, not points",
        body:
          "Testing only the new node lets a 10-unit step land on the far side of a wall and pass. The check clips the whole segment against each rectangle with Cohen–Sutherland outcodes, which rejects the trivial cases with a bitwise AND and only computes intersections when it has to. That mattered most in the narrow-passage map, whose walls are 1 unit thick.",
      },
      {
        title: "Keeping distance from obstacles",
        body:
          "Plain RRT happily routes along obstacle edges. The spacing variant inflates every obstacle by a margin (5 units on the main map, 2 in the narrow passage) and rejects samples that fall inside it, so the tree grows through open space. The inflation applies to sampling only; the edge check still uses the true obstacles, so the margin biases the path rather than guaranteeing it.",
      },
      {
        title: "Smoothing without undoing spacing",
        body:
          "Raw RRT paths are a chain of short, jagged steps. smooth_path() walks the path and jumps to the farthest waypoint with a clear line of sight, which cut the basic RRT path from 17.389 nodes to 3.227 on average. Because that shortcut only checks the raw obstacles, it would pull a spacing path back against the edges, so the app shows the spacing variant unsmoothed.",
      },
      {
        title: "Making variants comparable",
        body:
          "The variants share Node, steer(), the Environment and the collision check, and differ only in how they sample. Every one runs with the same step size (10), goal tolerance (5) and map, 1000 times each. Any difference in the numbers is then down to the sampler.",
      },
    ],
    stack: [
      { group: "Core", items: ["Python", "NumPy"] },
      { group: "Planning", items: ["RRT", "Goal-biased sampling", "Cohen–Sutherland clipping", "Path shortcutting"] },
      { group: "Tooling", items: ["Streamlit", "Matplotlib", "pandas"] },
    ],
    results: [
      "Each variant run 1000 times on a 100×100 map with four rectangular obstacles, start (10, 10) to goal (90, 90).",
      "Average nodes on the path: basic RRT 17.389, spacing 17.416, goal-biased 15.661; smoothing brought basic RRT down to 3.227.",
      "Exported benchmark for basic RRT: 100% success at 0.0104 s average planning time per run.",
      "On a second 50×100 map with a 10-unit passage between two walls, the spacing variant found a path through while keeping a 2-unit margin.",
    ],
    lessons: [
      "A comparison is only as fair as what's held fixed. Sharing one collision check and one steer() across the variants is what made their node counts comparable.",
      "Measure what the metric actually counts. The benchmark's path length was the number of waypoints, not distance travelled, and a 100% success rate came from a loop with no iteration cap, which can never report a failure.",
      "Improvements interact. Smoothing and obstacle spacing pull in opposite directions, and composing them naively throws one of them away.",
    ],
    timeline: [{ when: "Dec 2024 – Jan 2025", what: "Implemented the planner and its three samplers, benchmarked them over 1000 runs, and built the Streamlit visualiser." }],
    links: [
      { label: "GitHub", href: "https://github.com/CyberRik/path-planning" },
      { label: "Resume", href: PROFILE.resumeUrl },
    ],
    related: ["medproqa"],
  },
};

export const FEATURED: ProjectId[] = ["desi-agent", "ancora", "tinyserve", "indic-asr", "senpai", "toolcalllm", "gravton", "tax-cpa-parser", "reach"];
export const ARCHIVE: ProjectId[] = ["medproqa", "smartfan", "rrt"];

/* ------------------------------------------------------------------ */
/* milestones — the timeline reads as chapters, not dates             */

export interface Milestone {
  id: MilestoneId;
  /** chapter number — a restrained index, not an icon */
  glyph: string;
  chapter: string;
  period: string;
  /** the question every chapter answers: what did I become after this? */
  became: string;
  summary: string;
  projects: ProjectId[];
  /** work that isn't a project doc — roles, coursework, ongoing threads */
  alsoShipped: string[];
  tech: string[];
  lessons: string[];
  impact?: string;
}

export const MILESTONES: Milestone[] = [
  {
    id: "foundations",
    glyph: "01",
    chapter: "Learning Foundations",
    period: "2023 – 2024",
    became: "Someone who could turn an algorithm on a page into code that runs.",
    summary:
      "IIT Madras, and the years of fundamentals underneath everything after — Python, the maths, and the first projects where an algorithm had to survive contact with a real environment.",
    projects: ["rrt"],
    alsoShipped: [
      // Composed from EDUCATION rather than retyped, so the degree and dates
      // are stated once. No grade figure here: the served résumé
      // (resume_offcampus) omits marks, and the site should not state what the
      // document a visitor downloads does not.
      `B.Tech, ${EDUCATION.degree.replace(/^B\.Tech in /, "")} — IIT Madras (${EDUCATION.period})`,
      "Deep Learning Specialization (Andrew Ng)",
      "Practical Deep Learning (fast.ai)",
      "Mathematics for ML",
    ],
    tech: ["Python", "C++", "NumPy", "Algorithms", "Simulation"],
    lessons: [
      "A planner that works on a clean map and fails in a narrow passage isn't a working planner — the benchmark is the product.",
    ],
  },
  {
    id: "building",
    glyph: "02",
    chapter: "Building Products",
    period: "2025",
    became: "An engineer who ships whole systems, not notebooks.",
    summary:
      "The year the work stopped being exercises. R.E.A.C.H. went from idea to a funded cohort with a team behind it; MedProQA was a first real fine-tune with honest evaluation; SmartFan was the first end-to-end data pipeline — and the direct ancestor of the retrieval work that came later.",
    projects: ["reach", "medproqa", "smartfan"],
    // Course names match resume/courses.tex. "Full-Stack Development" is gone:
    // the résumé dropped it deliberately, React and Next.js already appearing
    // under skills. AI Agents takes its place from the same list.
    alsoShipped: ["LLM Fine-Tuning & Optimization", "Generative AI with LLMs (DeepLearning.AI)", "AI Agents (Hugging Face)"],
    tech: ["PyTorch", "Whisper", "LoRA", "Phi-3", "QLoRA", "Gemini", "n8n", "WebSockets"],
    lessons: [
      "Quantised fine-tuning is what makes ambitious training possible on real hardware budgets.",
      "Evaluation you hand-label yourself is the only evaluation you trust.",
    ],
    impact: "Selected from 200+ startups by IITM NIRMAAN; led a 5-member team to MVP.",
  },
  {
    id: "production",
    glyph: "03",
    chapter: "First Production Systems",
    period: "Sep 2025 – Oct 2025",
    became: "An engineer whose code had users who weren't me.",
    summary:
      "Tecnod8.ai — the first time the work went into someone else's production system. Multilingual document parsing across 5+ languages including RTL and Devanagari, with retrieval built on top.",
    projects: [],
    alsoShipped: [
      "Tecnod8.ai — Machine Learning Intern (Sep – Oct 2025)",
      "Multilingual document parsing: YOLOv10, PP-DocLayout-L, PaddleOCR",
      "Qwen2.5-VL for tables, figures and charts; Gemma embeddings into ChromaDB",
    ],
    tech: ["YOLOv10", "PaddleOCR", "Qwen2.5-VL", "ChromaDB", "Gemma embeddings"],
    lessons: [
      "Document AI is a routing problem — no single extractor survives real-world input variance.",
    ],
    // The national ranking used to be recorded here as an outcome of this
    // internship ("Top 20 ... for solo pipeline contribution"). It is Top 15 on
    // the NCIIPC challenge leaderboard, earned independently of Tecnod8 — the
    // résumé moved it into Achievements for exactly that reason, so it is no
    // longer claimed as this chapter's impact.
    impact: "Multilingual document parsing shipped into someone else's production system — 5+ languages, RTL and Devanagari, with retrieval built on top.",
  },
  {
    id: "data-systems",
    glyph: "04",
    chapter: "Engineering Data Systems",
    period: "Oct 2025 – Dec 2025",
    became: "The primary engineer on a system real firms depended on.",
    summary:
      "OctonData, and ownership of a document-intelligence platform running 10K+ pages a month. The Tax CPA Parser shipped to paying CPA firms — the first time a failure of mine would have been someone else's billable problem.",
    projects: ["tax-cpa-parser"],
    alsoShipped: ["OctonData — Software Engineer Intern, San Francisco (remote)"],
    tech: ["OCR", "CV layout detection", "Multimodal encoders", "Hybrid chunking", "Long-doc RAG"],
    lessons: [
      "Chunking strategy is not a detail — it moved long-document retrieval accuracy 20–30% on its own.",
    ],
    impact: "10K+ pages/month; 10+ U.S. CPA firms onboarded; manual review time cut 40%+.",
  },
  {
    id: "ai-infra",
    glyph: "05",
    chapter: "AI Infrastructure",
    period: "Feb 2026 – May 2026",
    became: "An infrastructure engineer — pipelines and services, not just models.",
    summary:
      "Gravton Labs. I owned the crawl and attribution layer under a GEO visibility platform — the discovery, scoring and budgeting that decide which pages get fetched, and the citation engine that turns raw citations into brand-level metrics. Plus a backend migration from Encore TypeScript to FastAPI, mid-flight.",
    projects: ["gravton"],
    alsoShipped: ["Gravton Labs — AI Engineer Intern, Ontario, Canada (remote)"],
    tech: ["FastAPI", "Airflow", "Apify", "Supabase", "Railway", "YAKE", "PostgreSQL"],
    lessons: [
      "Most pipeline bugs are ordering bugs. The scorer was correct; it just ran before the data it needed existed.",
      "A system that can honestly return nothing is worth more than one that always returns something.",
      "Migrating a live backend is a different discipline from building one — the system has to keep collecting while you replace it.",
    ],
    impact: "The crawler and citation engine behind Gravton's Insights Engine — mass-weighted brand share, rank and trend metrics over an internet-scale crawl.",
  },
  {
    id: "enterprise",
    glyph: "06",
    chapter: "Enterprise AI",
    period: "May 2026 – Jul 2026",
    became: "An AI systems engineer — training the model and architecting the platform it runs inside.",
    summary:
      "Otsuka Corporation, Tokyo. Two halves of the same problem: ToolCallLM trained Qwen3-8B to call functions reliably, and Senpai was the execution platform that put a planner, a scheduler and GraphRAG around it.",
    projects: ["senpai", "toolcalllm"],
    alsoShipped: ["Otsuka Corporation — Software Development Engineer Intern, Tokyo, Japan"],
    tech: ["Qwen3", "QLoRA", "DGX Spark", "BFCL", "GraphRAG", "Capability graphs", "Prefix caching"],
    lessons: [
      "Profile before optimising: LLM generation was 98% of a turn's wall time, so the fix was structural, not a bigger machine.",
    ],
    impact: "97.0% BFCL simple_python after QLoRA; the create_quote workflow cut from 334s to 152s; full training runs cut from 30–35 hours to about 24.",
  },
  {
    id: "current",
    glyph: "07",
    chapter: "Current Focus",
    period: "2026 – 2027",
    became: "An engineer who builds the runtime itself — and holds it to a proof, not a demo.",
    summary:
      "Placement preparation alongside continued work on AI systems, across two personal runtimes and a speech benchmark. Ancora makes losing a multi-step computation to a dead worker structurally impossible, proven with chaos experiments that assert rather than demonstrate. TinyServe takes the same scheduling instincts — admission control, fair queuing, backpressure — and applies them to LLM inference, built from scratch on llama.cpp at a scale where every latency number traces back to a specific decision in the code. The Indic speaker-attributed ASR work is the same instinct pointed at measurement: hold everything constant but one variable, assert the invariants, and report the method that failed next to the one that worked.",
    projects: ["desi-agent", "ancora", "tinyserve", "indic-asr"],
    alsoShipped: [
      "Ancora — fault-tolerant runtime for durable AI workflows (Temporal + Ray), open source",
      "TinyServe — from-scratch LLM inference runtime on llama.cpp, open source",
      "Indic Speaker-Attributed ASR — diarization and ASR benchmark over 12.26 h of 9-script audio, open source",
      "Desi Agent — multilingual banking tool-calling agent on Tiny Aya (Lexsi hackathon, Track 3); built with a teammate as a team of two",
      "Docling (Linux Foundation AI & Data) — 3 merged PRs: HTML links and images outside the base directory no longer fail a conversion; EPUB images in single quotes, percent-escaped paths, or with a query or fragment now load",
      "docling-serve — merged PR: the default code/formula preset now points at a preset Docling actually ships",
      "Meshery (CNCF) — 2 merged PRs: the Docker Extension proxy no longer hangs on login or logout without a websocket client, with a race fix and the auth token kept out of its logs; fixed the Helm Snapshot install URL and plugin usage in the docs",
      "Feast (Linux Foundation AI & Data) — merged PR: the DynamoDB online store now warms up its whole connection pool at startup instead of a single connection",
      "Placement preparation",
      "AI systems and distributed systems",
    ],
    tech: ["Temporal", "Ray", "Distributed Systems", "OpenTelemetry", "Chaos Engineering", "llama.cpp", "Continuous Batching", "Prometheus", "Grafana", "pyannote", "Whisper", "IndicConformer", "ONNX Runtime"],
    lessons: [
      "Durability and liveness are different guarantees. Temporal keeps your state through any crash; only spare capacity turns that into progress.",
      "A fault-tolerance claim needs a test that asserts it, not a demo that shows it once.",
      "The same scheduling primitives — admission control, fair queuing — apply whether the resource being rationed is worker-seconds or KV-cache memory; only the substrate changes.",
    ],
    impact:
      "Ancora: three durability invariants machine-checked from Temporal history after a real SIGKILL, kill-detection cut 9.5× to ~6s, 284 tests green. TinyServe: WFQ bounds scheduling unfairness 2.54× vs strict Priority's 3.87×, admission control verified under burst load (42 of 64 admitted at the KV boundary), 97.2% of wall time profiled inside llama_decode(). Indic ASR: a multi-softmax CTC decode defect root-caused for 14.8 WER points, and a language-ID fallback taking cpWER 79.67 → 72.96 with 0 of 99 recordings worse. B.Tech completes 2027.",
  },
];

/* ------------------------------------------------------------------ */
/* training log — what RM-OS's Terminal actually displays              */

/**
 * The Terminal app used to show invented training output (an H100
 * cluster, "Epoch 42/100", a loss curve) — none of which happened.
 *
 * These are the real lines, taken verbatim from the ToolCallLM
 * fine-tune that finished 2026-06-08. Numbers, timestamps, step counts
 * and the runtime are exactly as logged; the only edits are selection
 * (a 1,434-step run doesn't fit a 300px window) and redaction.
 *
 * REDACTED, DELIBERATELY — do not restore
 *   - the output path (contained a local username and home directory)
 *   - the internal experiment codename on the checkpoint directory
 * Both would have been published to a public site otherwise.
 *
 * STILL WORTH CONFIRMING
 * This ran on Otsuka infrastructure. Loss curves and eval metrics are
 * usually uncontroversial, but the call is Otsuka's, not this file's —
 * confirm before this goes public.
 *
 * NOTE ON METRICS
 * mean_token_accuracy (~0.96) is NOT the 97% BFCL figure on the résumé.
 * Token accuracy is per-token teacher-forced agreement during training;
 * BFCL is a downstream function-calling benchmark. Different things —
 * keep them separate wherever both appear.
 */
export type LogTone = "dim" | "txt" | "ok" | "accent";

export interface LogLine {
  text: string;
  tone?: LogTone;
  /** renders as a progress bar at this fill (0–1) rather than as text */
  bar?: number;
}

export const TRAINING_LOG: {
  title: string;
  /** shown in the window footer — where these numbers come from */
  provenance: string;
  lines: LogLine[];
} = {
  title: "train.log — ToolCallLM",
  provenance: "Real run, 2026-06-08. Excerpt of 1,434 steps; output path redacted.",
  lines: [
    { text: "$ tail -f train.log", tone: "dim" },
    { text: "", tone: "dim" },
    { text: "[09:40:29] step=1210  loss=0.4986  lr=3.29e-06", tone: "txt" },
    { text: "  mean_token_accuracy=0.9609  epoch=0.8442", tone: "dim" },
    { text: "[11:53:05] step=1300  eval_loss=0.1256", tone: "accent" },
    { text: "  eval_mean_token_accuracy=0.96", tone: "dim" },
    { text: "[14:15:39] step=1400  loss=0.4948  lr=8.14e-08", tone: "txt" },
    { text: "[14:24:47] step=1400  eval_loss=0.1255", tone: "accent" },
    { text: "[15:05:57] step=1430  loss=0.4897  lr=1.66e-09", tone: "txt" },
    { text: "  grad_norm=0.1013  epoch=0.9977", tone: "dim" },
    { text: "", tone: "dim" },
    { text: "[15:19:56] step=1434  eval_loss=0.1256  epoch=1", tone: "accent" },
    { text: "  eval_mean_token_accuracy=0.9599", tone: "dim" },
    { bar: 1, text: "" },
    { text: "1434/1434 · train_runtime 2.12e+04s (5h53m)", tone: "dim" },
    { text: "", tone: "dim" },
    { text: "[15:19:59] Training complete", tone: "ok" },
    { text: "[15:19:59] Saved final adapter to <redacted>/final", tone: "dim" },
  ],
};

export const MILESTONE_BY_ID = Object.fromEntries(
  MILESTONES.map((m) => [m.id, m]),
) as Record<MilestoneId, Milestone>;
