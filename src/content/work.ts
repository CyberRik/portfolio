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
/* projects                                                           */

export type ProjectId =
  | "ancora"
  | "tinyserve"
  | "senpai"
  | "toolcalllm"
  | "gravton"
  | "tax-cpa-parser"
  | "reach"
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
      "A durable execution runtime for AI workflows, built on Temporal for event-sourced durability and Ray for distributed compute. Every side-effecting step is recorded as an immutable event, so if a worker dies mid-run the workflow replays to exact state and continues where it stopped. Ancora is not an agent framework — it's the runtime that belongs underneath one.",
    problem:
      "AI pipelines lose work for boring reasons: an LLM call 500s, a GPU worker OOMs, a provider rate-limits, a pod is evicted — and a multi-step, multi-dollar computation vanishes with no way to resume it. Durable execution solves that in principle, but 'kill a worker and the run survives' is easy to claim and hard to prove, and the interesting failure is never the crash itself. It's whether the side effects that were half-committed when the process died fire again on recovery.",
    architecture: {
      summary:
        "A FastAPI control plane starts workflows on Temporal; deterministic workflow workers decide what to schedule and a pool of activity workers execute nodes, dispatching heavy work to Ray with async completion so a dispatcher slot is never held by a long compute. An admission scheduler decides whether running a node now is wise. Workers emit lifecycle events to Redis Streams; a consumer projects them into Postgres and the dashboard animates the run's DAG live over WebSocket, while a reconciler heals the projections from Temporal history — the only source of truth.",
      diagram: {
        caption: "Ancora — durability core, compute, and the observability plane",
        nodes: [
          { id: "api", label: "API Gateway", sub: "REST · WebSocket", col: 0, row: 1, kind: "input" },
          { id: "temporal", label: "Temporal", sub: "event-sourced history", col: 1, row: 1, kind: "store" },
          { id: "ww", label: "Workflow Workers", sub: "deterministic", col: 2, row: 0, kind: "core" },
          { id: "aw", label: "Activity Workers", sub: "×3 replicas", col: 2, row: 2, kind: "core" },
          { id: "sched", label: "Scheduler", sub: "admission control", col: 3, row: 3, kind: "core" },
          { id: "ray", label: "Ray", sub: "async completion", col: 3, row: 2, kind: "model" },
          { id: "bus", label: "Redis Streams", sub: "event bus", col: 3, row: 1, kind: "core" },
          { id: "consumer", label: "Event Consumer", sub: "+ reconciler", col: 4, row: 1, kind: "core" },
          { id: "pg", label: "Postgres", sub: "projections", col: 5, row: 1, kind: "store" },
          { id: "dash", label: "Live DAG · Chaos Lab", col: 6, row: 1, kind: "output" },
        ],
        edges: [
          { from: "api", to: "temporal", label: "start · signal" },
          { from: "temporal", to: "ww" },
          { from: "temporal", to: "aw", label: "poll · heartbeat" },
          { from: "ww", to: "temporal", dashed: true, label: "schedule" },
          { from: "aw", to: "ray" },
          { from: "aw", to: "sched", dashed: true, label: "admit?" },
          { from: "aw", to: "bus", dashed: true },
          { from: "ww", to: "bus", dashed: true },
          { from: "bus", to: "consumer" },
          { from: "consumer", to: "pg" },
          { from: "consumer", to: "temporal", dashed: true, label: "reconcile" },
          { from: "pg", to: "dash" },
        ],
      },
    },
    challenges: [
      {
        title: "Chaos experiments that assert instead of demonstrate",
        body:
          "A demo that kills a worker and ends with a green checkmark proves nothing — someone has to squint at the UI and agree. So the chaos engine is a test: it starts a run, SIGKILLs a real activity-worker container mid-flight, waits out the actual recovery, then machine-checks three invariants from Temporal's own history — no lost state, no re-executed activities, exactly-once effects — and measures recovery time against an SLO. The same invariant checkers run as pure unit tests in CI against synthetic post-kill histories, so the correctness properties are pinned without a live cluster.",
      },
      {
        title: "Reconstructing a run's DAG without a single timing heuristic",
        body:
          "Workflows here are ordinary Python deciding step by step what to schedule, so the DAG is emergent — fan-out width comes from the input. The naive way to draw \"these ran in parallel\" is to compare timestamps, and it's a flattering lie: a fan-out drawn as a chain looks perfectly reasonable to anyone who hasn't read the code. Ancora reads Temporal's own causality instead — every ActivityTaskScheduled event names the workflow task that commanded it, so activities sharing that id were genuinely decided together. The columns are exact, and no layout library is involved, so the graph never drifts between polls.",
      },
      {
        title: "Temporal writes ActivityTaskStarted lazily",
        body:
          "The event for an attempt is only written once it reaches a terminal state — so the attempt running right now, including one stranded on a just-killed worker, is absent from history entirely. Reading history alone draws it as \"still queued,\" which is exactly backwards. The recovery view folds in describe().pending_activities to see the present, and separates three waits that look identical from outside: queued (no capacity yet), detecting (an attempt stranded on a dead process), and backoff (retry policy).",
      },
      {
        title: "Proving exactly-once survives a crash mid-effect",
        body:
          "A unique key structurally forbids two rows per effect, so the double-write direction was never the real risk. The one a kill actually introduces is the opposite: an effect that began — row written pending — but whose worker died before committing the result, leaving a stale pending that a retry could re-fire. The chaos engine asserts every guarded effect reached done, so a half-committed side effect fails the experiment rather than silently double-firing in production.",
      },
      {
        title: "Durability is not liveness",
        body:
          "Temporal guarantees state survives any worker death; it cannot manufacture progress out of no capacity. A stranded activity only finishes if some worker polls its queue, so fault tolerance had to become redundancy — a pool of activity workers, where killing one lets survivors recover automatically. A quieter consequence of SIGKILL: it skips graceful deregistration, orphaning worker-registry rows, so the fleet view claimed capacity that no longer existed. A reaper prunes them.",
      },
      {
        title: "Fast failover — detection versus the timeout",
        body:
          "Without heartbeats a killed worker's activity is only noticed at start_to_close, up to 60 seconds, which turns the whole demo into an awkward wait. Emitting a heartbeat every 2s under a ~6s heartbeat timeout cuts detection to ~6 seconds — 9.5× — while still never mistaking a slow worker for a dead one. It also surfaced a latent bug: a policy declared a 30s heartbeat timeout while nothing ever emitted heartbeats, so any genuinely long node would have falsely timed out.",
      },
      {
        title: "Keeping one trace unbroken across the Ray boundary",
        body:
          "Temporal's OTel interceptor carries context across the workflow-to-activity hop, but a compute function is pickled and shipped to another process, and OTel's ambient context doesn't travel with it — the compute span orphans into its own root trace. The fix is to inject the W3C traceparent into a plain dict, send it as data alongside the function, and re-extract it inside the worker. Contextvars don't cross a thread-pool boundary either, so this is required for the local backend too.",
      },
    ],
    stack: [
      { group: "Durability", items: ["Temporal", "Event sourcing", "Deterministic replay", "Idempotency inbox"] },
      { group: "Compute", items: ["Ray", "Async activity completion", "Heartbeat checkpointing"] },
      { group: "Services", items: ["Python 3.11", "FastAPI", "Pydantic v2", "SQLAlchemy", "Postgres", "Redis Streams"] },
      { group: "Observability", items: ["OpenTelemetry", "Jaeger", "Prometheus", "Grafana"] },
      { group: "Web", items: ["Next.js 14", "React Flow", "WebSocket live tail"] },
      { group: "Quality", items: ["pytest", "mypy --strict", "ruff", "Playwright", "Docker Compose"] },
    ],
    results: [
      "Chaos experiments that SIGKILL a live worker container mid-run and machine-check three durability invariants from Temporal history — no lost state, no re-executed activities, exactly-once effects — with recovery time measured against an SLO.",
      "Kill-detection cut from ~60s to ~6s (9.5×) by heartbeating activities under a short heartbeat timeout.",
      "Run DAGs reconstructed from event causality rather than timestamps — exact fan-out, live per-node state, retries collapsed, critical path highlighted.",
      "284 passing tests, mypy --strict and ruff clean across the workspace; every subsystem ships a replay test and, where it touches failure, a chaos assertion.",
      "One unbroken OTel trace from API through workflow and activity to the compute call, across the Ray process boundary.",
      "Full stack — Temporal, Postgres, Redis, 3 worker replicas, scheduler, Jaeger, Prometheus, Grafana, dashboard — behind a single make up.",
    ],
    lessons: [
      "A durability claim is worth nothing until something asserts it. Turning the demo into a test that verifies invariants from history is the entire difference between a screenshot and a guarantee.",
      "Durability and liveness are separate properties, and conflating them is the beginner's mistake with Temporal. Your state is safe from any crash; progress still requires a worker alive to poll the queue.",
      "Read the event log's semantics before building on it. ActivityTaskStarted being written lazily means history alone renders a stranded attempt as queued — the failure case the view existed to explain was the one it got wrong.",
      "The dangerous half of exactly-once is the half-committed effect, not the duplicate one. A unique constraint handles duplicates for free; a worker that died between beginning and committing is what an idempotency guard has to actually survive.",
      "Distributed tracing breaks precisely where the process boundary is invisible. Ambient context is not data, and anything that gets pickled and shipped needs its trace context passed explicitly.",
    ],
    timeline: [
      { when: "21 Jul 2026", what: "Monorepo scaffold, Compose stack, API gateway and dashboard shell." },
      { when: "22 Jul 2026", what: "Durable core and SDK; activity workers with Ray dispatch and async completion; first worker-crash durability test." },
      { when: "23 Jul 2026", what: "Admission scheduler, built-in node library, idempotency inbox; Chaos Lab and the recovery view." },
      { when: "26 Jul 2026", what: "Event-sourced observability — projections, live DAG over WebSocket, OTel tracing, Prometheus/Grafana, replay and critical path." },
      { when: "27 Jul 2026", what: "Asserting chaos experiments and fast failover via heartbeats." },
      { when: "Next", what: "Kubernetes (Helm/KubeRay/KEDA), OIDC/RBAC and tenant isolation, signed third-party plugins." },
    ],
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
    tagline: "A from-scratch LLM inference runtime on llama.cpp — continuous batching, KV-cache accounting, and fair scheduling, built to be fully explainable",
    milestone: "current",

    overview:
      "A small, fully-understood inference runtime built on top of llama.cpp: continuous batching, block-based KV-cache accounting, admission control, and pluggable fair scheduling (FIFO / priority / WFQ), implemented from scratch in async Python. llama.cpp does the matrix multiplication; everything above that line — what runs next, whose tokens go in this batch, when a request gets rejected, how backpressure reaches the client — is TinyServe's own code, small enough to hold in your head and benchmarked to prove every claim.",
    problem:
      "The scheduling ideas behind vLLM and SGLang — continuous batching, paged KV-cache memory, fairness-aware admission control — are usually learned by reading about them, because the real implementations live inside codebases too large to trace end-to-end in a sitting. The goal wasn't to beat those systems on throughput; it was to build the same ideas at a scale where any latency number can be traced back to a specific scheduling decision in the code, backed by a real metric, not a guess.",
    architecture: {
      summary:
        "One background asyncio task (the batch loop) owns every call into llama.cpp, which sidesteps needing locks around its state. Each tick: the Admission Controller fail-fast-rejects on queue depth or KV budget; the Scheduler asks the active policy which waiting requests claim a newly-free concurrency slot; the Batch Builder merges chunked-prefill slices and decode steps into one llama.cpp batch call; the KV Cache Manager reserves/releases logical blocks over llama.cpp's own per-sequence KV API; and the Stream Manager detokenizes incrementally and pushes tokens over SSE.",
      diagram: {
        caption: "TinyServe — one request, one shared batch loop",
        nodes: [
          { id: "client", label: "Client", sub: "POST /generate", col: 0, row: 1, kind: "input" },
          { id: "admission", label: "Admission Controller", sub: "queue depth + KV budget", col: 1, row: 1, kind: "core" },
          { id: "queue", label: "Request Queue", sub: "reorderable pool", col: 2, row: 1, kind: "core" },
          { id: "sched", label: "Scheduler", sub: "FIFO · Priority · WFQ", col: 3, row: 0, kind: "core" },
          { id: "batch", label: "Batch Builder", sub: "chunked prefill", col: 3, row: 2, kind: "core" },
          { id: "kv", label: "KV Cache Manager", sub: "block accounting", col: 4, row: 1, kind: "store" },
          { id: "runtime", label: "Runtime", sub: "llama_decode()", col: 5, row: 1, kind: "model" },
          { id: "stream", label: "Stream Manager", sub: "SSE", col: 6, row: 1, kind: "output" },
        ],
        edges: [
          { from: "client", to: "admission" },
          { from: "admission", to: "client", dashed: true, label: "503 reject" },
          { from: "admission", to: "queue" },
          { from: "queue", to: "sched" },
          { from: "sched", to: "batch" },
          { from: "batch", to: "kv" },
          { from: "kv", to: "runtime" },
          { from: "runtime", to: "stream" },
          { from: "stream", to: "client", dashed: true, label: "SSE tokens" },
        ],
      },
    },
    challenges: [
      {
        title: "Validating the riskiest bet before building around it",
        body:
          "Real multi-sequence continuous batching — one llama_decode() call advancing several independent requests together — was the whole point of the project and the part most likely not to work with llama-cpp-python's high-level API. It was proven with a standalone script first: two prompts, one decode call, two coherent independent continuations. Only after that worked did the queue, scheduler and admission layers get built on top of the assumption.",
      },
      {
        title: "What a scheduling policy actually controls once batching is continuous",
        body:
          "Every active sequence advances one decode step per tick regardless of policy — that part isn't negotiable. The one honest lever left is which waiting request claims a free concurrency slot next. FIFO, strict Priority and WFQ are three benchmarked answers to exactly that question, not three different execution strategies pretending otherwise.",
      },
      {
        title: "A benchmark that argued against its own hypothesis",
        body:
          "Chunked prefill was expected to visibly protect short requests' tail latency from a long prompt's prefill. It didn't, measurably, at the scale tested — because the batch builder already sorts sequences by ascending pending-token count each tick, so short requests get packed in before a long prefill regardless of chunk size. The mechanism was traced and reported as a negative result, not tuned until a difference appeared.",
      },
      {
        title: "A pre-release audit found a real gap in the admission controller",
        body:
          "A self-audit against the original design doc, run deliberately before tagging a v1.0, found the admission controller was only checking KV-cache budget — missing the queue-depth backpressure check the design called for, so a burst of many small-footprint requests could grow the wait queue unboundedly. Fixed and verified live: with a deliberately small queue cap, exactly the expected split of requests came back accepted vs. rejected with a distinct queue_full reason.",
      },
      {
        title: "Cross-checking a profiler against your own metric",
        body:
          "A real py-spy sampling session found 97.2% of wall time inside llama_decode(). Rather than trust that number in isolation, it was checked quantitatively against the server's own decode_step_duration_seconds histogram from the same window — independent agreement between a profiler and a self-emitted metric, not a single unverified reading.",
      },
      {
        title: "Catching an overclaim in the project's own benchmark doc",
        body:
          "A sustained-load benchmark's write-up originally claimed 'no drift or leak' from a 15-second run — nowhere near long enough to support that phrase in the sense it usually means. The same audit that found the admission-control gap caught this too, and the claim was walked back to exactly what a 15-second window can honestly demonstrate.",
      },
    ],
    stack: [
      { group: "Runtime", items: ["llama.cpp", "Python 3.11", "AsyncIO", "ctypes bindings"] },
      { group: "Scheduling", items: ["Continuous batching", "Chunked prefill", "FIFO / Priority / WFQ"] },
      { group: "Serving", items: ["FastAPI", "SSE streaming"] },
      { group: "Observability", items: ["Prometheus", "Grafana", "OpenTelemetry", "py-spy"] },
      { group: "Quality", items: ["pytest", "mypy --strict", "ruff", "Docker Compose"] },
    ],
    results: [
      "Real multi-sequence continuous batching validated with a standalone proof-of-concept before the surrounding scheduler was built — one llama_decode() call advancing independent sequences together.",
      "Admission control verified live under burst load: 42/64 requests accepted at exactly the KV-budget boundary, the remainder rejected with a distinct reason rather than queued indefinitely.",
      "WFQ bounds unfairness at 2.54× against strict Priority's 3.87×, while FIFO ignores priority entirely (0.45×) — measured head-to-head, not asserted.",
      "py-spy profiling found 97.2% of wall time inside llama_decode(), cross-checked quantitatively against the server's own decode_step_duration_seconds metric.",
      "A pre-release engineering audit against the original design doc found and fixed a real gap — the admission controller was missing its queue-depth backpressure check — before shipping.",
      "8 benchmark scripts, a Prometheus + Grafana dashboard stack, and full architecture documentation, including every place the shipped code intentionally diverges from the design doc.",
    ],
    lessons: [
      "Validate the riskiest architectural bet with a throwaway proof-of-concept before building the system around the assumption it depends on.",
      "Once continuous batching is running, a scheduling policy has exactly one lever left — which requests claim a free slot — and pretending otherwise would misrepresent what the code actually does.",
      "A benchmark that fails to show the effect you expected is still a result if you can name the mechanism. Chunked prefill's 'no measurable difference' finding came with a specific reason, not a shrug.",
      "Audit your own claims before publishing them. A 15-second sustained-load run doesn't support a 'no memory leak' claim, and catching that before it shipped was the actual point of the self-audit.",
    ],
    timeline: [
      { when: "Aug 2026", what: "Phases 0-1: bare execution loop against llama.cpp, then SSE streaming and a FIFO queue." },
      { when: "Aug 2026", what: "Phase 2: real multi-sequence continuous batching and the KV Cache Manager, validated by a standalone POC first." },
      { when: "Aug 2026", what: "Phase 3: chunked prefill, FIFO/Priority/WFQ scheduling policies, cancellation and timeouts." },
      { when: "Aug 2026", what: "Phase 4: Prometheus metrics, OpenTelemetry tracing, a real Grafana dashboard, and a py-spy profiling session." },
      { when: "Aug 2026", what: "Benchmark suite (8 scripts) and full architecture docs; a pre-release self-audit found and fixed a real gap in admission control." },
    ],
    links: [{ label: "GitHub", href: "https://github.com/CyberRik/tinyserve" }],
    related: ["ancora", "toolcalllm"],
  },

  /* ---------------------------------------------------------------- */
  senpai: {
    id: "senpai",
    title: "Senpai",
    tier: "featured",
    role: "Architect",
    period: "May 2026 – Jul 2026",
    context: "Otsuka Corporation · Tokyo",
    tagline: "Enterprise AI execution platform — planner-driven capability graphs",
    milestone: "enterprise",

    overview:
      "An enterprise AI execution platform built at Otsuka. Rather than a single prompt-and-respond agent, Senpai decomposes a request into a capability graph, resolves it as a dependency-aware DAG, and executes the nodes against retrieval and tool backends — with GraphRAG over enterprise knowledge and CRM data as the evidence layer.",
    problem:
      "Sales coaching is a judgement task built on records nobody has time to read — deal histories, activity logs, and what actually worked for comparable accounts. An assistant is the obvious shape for it, and also the dangerous one: a coaching answer that invents a win rate is worse than no answer, because it's confident, specific, and indistinguishable from a real one. The constraint that shaped the whole system was that every output has to trace back to a real record or a human-approved principle. Trust beats cleverness.",
    architecture: {
      summary:
        "A planner turns the request into a capability graph; an adaptive scheduler resolves that graph into a dependency-aware DAG and executes ready nodes in parallel. Retrieval nodes draw on GraphRAG and CRM sources and return an EvidenceBundle, which the reasoner consumes to produce artifacts inside a persistent workspace.",
      diagram: {
        caption: "Senpai — request to artifact",
        nodes: [
          { id: "req", label: "Request", col: 0, row: 1, kind: "input" },
          { id: "planner", label: "Planner", sub: "capability graph", col: 1, row: 1, kind: "core" },
          { id: "sched", label: "Adaptive Scheduler", sub: "dependency-aware DAG", col: 2, row: 1, kind: "core" },
          { id: "graphrag", label: "GraphRAG", col: 3, row: 0, kind: "store" },
          { id: "crm", label: "CRM Retrieval", col: 3, row: 2, kind: "store" },
          { id: "evidence", label: "EvidenceBundle", col: 4, row: 1, kind: "core" },
          { id: "reasoner", label: "Reasoner", col: 5, row: 1, kind: "model" },
          { id: "artifacts", label: "Artifacts", col: 6, row: 1, kind: "output" },
          { id: "workspace", label: "Workspace", sub: "persistent state", col: 5, row: 2, kind: "store" },
        ],
        edges: [
          { from: "req", to: "planner" },
          { from: "planner", to: "sched" },
          { from: "sched", to: "graphrag" },
          { from: "sched", to: "crm" },
          { from: "graphrag", to: "evidence" },
          { from: "crm", to: "evidence" },
          { from: "evidence", to: "reasoner" },
          { from: "reasoner", to: "artifacts" },
          { from: "reasoner", to: "workspace", dashed: true },
          { from: "workspace", to: "sched", dashed: true, label: "re-plan" },
        ],
      },
    },
    challenges: [
      {
        title: "Inference throughput under enterprise load",
        body:
          "Serving the platform at usable latency meant attacking the token pipeline directly: prefix caching, persistent context caching across turns, and parallel execution of independent DAG nodes. That combination took throughput from 11 to 55 tok/s.",
      },
      {
        title: "Profiling before optimising — the double generation",
        body:
          "The platform was correct but slow, and the obvious suspects were wrong. Instrumenting each component of a turn showed LLM generation was 98% of wall time; tool execution was 0.8% and retrieval about 1%. The real cost was structural: the tool-selection round ran with tool_choice=\"auto\", so when the model decided no further tools were needed it generated the entire answer just to signal that — and that answer was thrown away and regenerated by the synthesis round. Long turns paid for their answer twice. An earlier estimate had blamed selection for 130s; that was a misattribution that lumped the discarded answer round into the selection number.",
      },
      {
        title: "Two failed fixes before the right one",
        body:
          "Capping max_tokens on the selection round truncated long tool calls — proposal payloads whose reasoning block ate the budget — and the server started returning 500s on unparseable tool-call JSON. Streaming the selection and aborting once answer prose began broke any tool that emits a preamble before its call. Both reverted. What worked was removing the ambiguity instead of policing it: run selection with tool_choice=\"required\" and add a finish sentinel tool, so the model always emits a tool call — a real one, or finish to end the loop. Selection can no longer generate a throwaway answer because it can no longer generate prose at all.",
      },
      {
        title: "Grounding: a whitelist, not a prompt instruction",
        body:
          "Segment intelligence runs on a networkx graph of reps, deals, customers and products, with deals denormalised so multi-hop questions resolve in memory in milliseconds without an LLM. The statistics are computed deterministically; the LLM only translates them into prose. What keeps it honest is a numeric gate — the report's real figures form a whitelist, every number in the generated text is extracted by regex, and if any number isn't in the whitelist the text is discarded and a templated deterministic string is used instead. A model told not to invent statistics still will. One that structurally cannot publish an unlisted number won't.",
      },
      {
        title: "Deciding what runs on which model, with data",
        body:
          "Testing whether synthesis could move to a smaller model meant freezing the post-tool context once and running the identical context on each arm. A bf16 8B gave only 1.11× — bandwidth-bound, the same bytes per token as the quantised 27B. Q4 was the actual lever: 2.72× wall, 3.8× decode, at grounding parity. Style was the cost, not accuracy. A pilot suggested prompt engineering could close the style gap; the larger run overturned it, and the few-shot arm traded grounding specificity for prose. Tool selection was tested on the 8B too and came back 2/5 reliable, which also killed the hybrid — the fallback penalty made most turns net slower.",
      },
      {
        title: "The 93 GB that wasn't ours",
        body:
          "Models that had coexisted fine started hitting OOM on the shared GB10 box, and nothing in ps or free explained it. Only nvidia-smi's compute-apps query showed the real picture: a teammate's container serving a 35B model was holding ~93 GB of 119 GB unified memory. Once stopped, 5.8 GB used against 113 GB free and both our models fit with room to spare. Time lost to it went into a standing rule — on a shared box, check nvidia-smi and docker ps before blaming your own services.",
      },
    ],
    stack: [
      { group: "Orchestration", items: ["Capability graphs", "DAG execution", "Adaptive scheduling"] },
      { group: "Retrieval", items: ["GraphRAG", "CRM retrieval"] },
      { group: "Serving", items: ["Prefix caching", "Persistent context caching", "Parallel execution"] },
    ],
    results: [
      "5× inference throughput — 11 → 55 tok/s — via prefix caching, persistent context caching and parallel execution.",
      "Eliminated a wasted full generation per turn via the finish-tool pattern; smoke-tested across all seven workflows with no regressions.",
      "Routing synthesis to a Q4 8B cut the slowest workflow from 334s to 152s, at measured grounding parity (0.969 vs 0.969).",
      "Planner-driven capability graphs executed as dependency-aware DAGs, with GraphRAG as the grounding layer.",
      "A numeric grounding gate that discards any generated text containing a statistic not present in the computed report.",
    ],
    lessons: [
      "Profile before optimising, and distrust your own earlier numbers. The latency was never in tool execution or retrieval — it was one wasted generation per turn, hidden inside a metric that had been attributed to the wrong stage.",
      "When a model keeps doing something you don't want, remove the option rather than adding an instruction. Capping tokens and aborting streams both failed because they policed the behaviour; the finish tool worked because it made the behaviour unrepresentable.",
      "Grounding has to be mechanical. The numeric whitelist catches hallucinated statistics that no amount of prompt discipline reliably prevents.",
      "Write down the experiments that failed, with their numbers. The 8B-for-everything idea looked good at n=4 and lost at n=8 — recording that is what stops it being re-proposed a month later.",
    ],
    timeline: [
      { when: "May 2026", what: "Joined Otsuka in Tokyo as SDE intern." },
      { when: "May – Jul 2026", what: "Architected Senpai — planner, scheduler, GraphRAG evidence layer." },
      { when: "Jul 2026", what: "Throughput work landed: 11 → 55 tok/s." },
    ],
    links: [{ label: "Resume", href: "/resume.pdf" }],
    related: ["toolcalllm", "gravton", "ancora"],
  },

  /* ---------------------------------------------------------------- */
  toolcalllm: {
    id: "toolcalllm",
    title: "ToolCallLM",
    tier: "featured",
    role: "ML Engineer",
    period: "May 2026 – Jul 2026",
    context: "Otsuka Corporation · Tokyo",
    tagline: "Function-calling model training — Qwen3-8B, QLoRA, BFCL evaluation",
    milestone: "enterprise",

    overview:
      "Training work behind the tool-calling layer at Otsuka: synthetic-data pipelines that generated 50K+ function-calling examples, QLoRA fine-tuning of Qwen3-8B on an NVIDIA DGX Spark, and an automated evaluation loop scored against the Berkeley Function-Calling Leaderboard (BFCL).",
    problem:
      "Open-source models are inconsistent at function calling — argument shapes drift, optional parameters get invented, and the failure is silent because the output still looks like valid JSON. Closing that gap for enterprise use meant training rather than prompting, which in turn meant manufacturing training data that didn't exist.",
    architecture: {
      summary:
        "A synthetic-data pipeline produces function-calling examples from tool schemas; those feed QLoRA fine-tuning of Qwen3-8B on a DGX Spark; each checkpoint runs through an automated eval harness scored on BFCL, and the result decides whether the run continues.",
      diagram: {
        caption: "ToolCallLM — data to evaluated checkpoint",
        nodes: [
          { id: "schemas", label: "Tool Schemas", col: 0, row: 1, kind: "input" },
          { id: "synth", label: "Synthetic Data", sub: "50K+ examples", col: 1, row: 1, kind: "core" },
          { id: "base", label: "Qwen3-8B", sub: "base model", col: 1, row: 0, kind: "model" },
          { id: "qlora", label: "QLoRA Fine-tune", sub: "DGX Spark", col: 2, row: 1, kind: "core" },
          { id: "ckpt", label: "Checkpoint", col: 3, row: 1, kind: "store" },
          { id: "evals", label: "Automated Evals", col: 4, row: 1, kind: "core" },
          { id: "bfcl", label: "BFCL Score", col: 5, row: 1, kind: "output" },
        ],
        edges: [
          { from: "schemas", to: "synth" },
          { from: "synth", to: "qlora" },
          { from: "base", to: "qlora" },
          { from: "qlora", to: "ckpt" },
          { from: "ckpt", to: "evals" },
          { from: "evals", to: "bfcl" },
          { from: "evals", to: "synth", dashed: true, label: "data gaps" },
        ],
      },
    },
    challenges: [
      {
        title: "GPU memory on a single node",
        body:
          "Fine-tuning an 8B model on one DGX Spark is a memory problem before it's a learning problem — QLoRA's 4-bit quantised base plus low-rank adapters is what makes the run fit at all, trading some precision for the ability to train.",
      },
      {
        title: "Blending datasets so the mix teaches something",
        body:
          "Single-turn examples from xLAM and multi-turn trajectories from ToolACE arrive in incompatible raw formats, so blending happens before preprocessing rather than fighting the normaliser. Random sampling from each was the obvious approach and the wrong one — it oversamples domains the datasets already agree on. Diversity sampling scores candidates against a coverage report of what's already represented and prioritises novel tool domains, conversations deeper than average, and examples containing error-recovery patterns. The most important addition was negative data: chat conversations with irrelevant tool schemas injected, where the correct behaviour is to ignore the tools entirely. A model trained only on examples where a tool should be called learns that a tool should always be called.",
      },
      {
        title: "The loss was being computed on the wrong tokens",
        body:
          "The original pipeline trained with full-sequence causal loss, so gradients flowed through system prompts, user turns, inlined tool schemas and tool results. On examples with long tool context, non-assistant tokens dominated the loss — the model was being optimised to mimic conversations rather than to produce good assistant behaviour. Underneath it was a second, quieter bug: the pad token was set to the EOS token, and the collator masks labels wherever input matches the pad id, so turn-terminator tokens were being dropped from the loss exactly where truncated JSON and EOS bailout were the observed failures. Fixing it meant response-only masking via generation markers, explicit labels with -100 outside assistant spans, and a dedicated pad token so it stops aliasing EOS. The uncomfortable consequence: every checkpoint from before the fix was optimising a different objective, so those comparisons had to be thrown out rather than reinterpreted.",
      },
      {
        title: "Reading a flat loss curve",
        body:
          "Training loss sat around 0.46–0.52 for the last few hundred steps while eval loss held almost perfectly flat — 0.1256 at step 1300, 0.1255 at 1400, 0.1256 at the end. A curve that stops moving is ambiguous: it can mean converged, or it can mean the remaining headroom isn't in this data. Calling that correctly is what decides whether another epoch is worth the GPU hours.",
      },
      {
        title: "A failure taxonomy, because 'wrong' isn't a diagnosis",
        body:
          "An accuracy number tells you how often the model failed, not what to do about it. The eval harness classifies every failure into categories that imply different fixes: malformed JSON and partial JSON are separated because partial JSON is a generation-length problem rather than a formatting one, and it's detected by where in the string the parse error falls. Calling a tool that exists but isn't the right one is distinct from hallucinating a tool name that was never offered. Inventing arguments, omitting required ones, and getting a type wrong are three different schema failures. There are also behavioural categories for the cases where the model called a tool when it should have asked a clarifying question or refused — failures that any output-shape metric scores as fine. Each record carries the tool name, field path and which parser strategy was active, so a category can be traced back to specific examples instead of staying a count.",
      },
    ],
    stack: [
      { group: "Model", items: ["Qwen3-8B", "QLoRA", "LoRA", "PEFT"] },
      { group: "Hardware", items: ["NVIDIA DGX Spark"] },
      { group: "Data", items: ["Synthetic generation", "Schema normalisation"] },
      { group: "Evaluation", items: ["BFCL"] },
    ],
    results: [
      "97% BFCL accuracy on single-turn function calling with the fine-tuned Qwen3-8B.",
      "50K+ synthetic function-calling examples produced for open-source LLM training.",
      // straight from the 2026-06-08 run log; see TRAINING_LOG below
      "Converged in a single epoch — 1,434 steps in 5h53m, final eval loss 0.1256 at 96.0% eval token accuracy.",
    ],
    lessons: [
      "Check what the loss is actually computed over before trusting any curve. Full-sequence loss on tool-heavy examples optimises conversation mimicry, and the training numbers look perfectly reasonable while it happens.",
      "The worst bugs are the ones that only misbehave in the exact place you're already looking. Pad aliasing EOS suppressed loss on turn terminators — and unterminated output was the failure being investigated.",
      "A model trained only on examples where a tool should be called learns that a tool should always be called. The negative examples did as much work as the positive ones.",
      "Classify failures, don't just count them. Malformed JSON and truncated JSON have the same accuracy cost and completely different fixes.",
      "Keep training metrics and benchmark metrics separate in your head and in your writeups. Token accuracy and BFCL accuracy are both roughly 96–97% here and measure entirely different things; conflating them would be an easy and embarrassing mistake.",
    ],
    timeline: [
      { when: "May 2026", what: "Synthetic-data pipeline for function-calling examples." },
      { when: "Jun 2026", what: "QLoRA fine-tuning of Qwen3-8B on DGX Spark." },
      { when: "Jul 2026", what: "Automated evals — 97% BFCL single-turn accuracy." },
    ],
    links: [{ label: "Resume", href: "/resume.pdf" }],
    related: ["senpai", "medproqa"],
  },

  /* ---------------------------------------------------------------- */
  gravton: {
    id: "gravton",
    title: "Gravton — Crawler, Citations & Social Pipelines",
    tier: "featured",
    role: "AI Engineer",
    period: "Feb 2026 – Jun 2026",
    context: "Gravton Labs · Ontario, Canada (remote)",
    tagline: "The crawl, attribution and ingestion layer under a GEO visibility platform",
    milestone: "ai-infra",

    overview:
      "Gravton is an AI-search-visibility platform: it tells a brand how it shows up inside answers from ChatGPT, Perplexity, Claude and Google AI Overviews. I built the data layer underneath it — the crawler that decides which pages are worth fetching, the citation engine that turns raw citations into the brand-level metrics the product reports, and the Reddit, Quora and YouTube pipelines that bring community signal in. Later I moved the whole orchestration layer onto Airflow and took it to production.",
    problem:
      "Both halves are selection problems disguised as data problems. A crawler with a page budget spends it on whatever URL order it happened to receive, so it drowns in blog posts and misses pricing and comparison pages — exactly the commercial-intent content that drives AI answers. And a citation is only useful once it's attributed to a brand; do that against a global brand list and every row matches something, which is worse than matching nothing.",
    architecture: {
      summary:
        "The crawler is a four-stage control plane rather than a fetch loop: discover (sitemaps, DOM link extraction, an adaptive pass, seed fallback), score (keyword relevance, sitemap boost, depth-aware selection), select against typed budgets, then fetch through Apify. Enrichment classifies page type with a confidence signal and grades fetch reliability, so blocked and thin pages are dropped before they reach downstream scoring. The citation side aggregates in three stages — per prompt, per model, then cross-model with weights — into mass-weighted share, rank and trend tables.",
      diagram: {
        caption: "Discovery to insight — selection happens before spend",
        nodes: [
          { id: "seeds", label: "Sitemaps · DOM links", sub: "discovery", col: 0, row: 1, kind: "input" },
          { id: "score", label: "URL Scoring", sub: "relevance · depth", col: 1, row: 1, kind: "core" },
          { id: "budget", label: "Typed Budgets", sub: "per-type slots", col: 2, row: 1, kind: "core" },
          { id: "apify", label: "Apify Fetch", col: 3, row: 1, kind: "core" },
          { id: "enrich", label: "Enrichment", sub: "type · quality", col: 4, row: 1, kind: "core" },
          { id: "candidates", label: "Candidate Map", sub: "layered fallback", col: 5, row: 0, kind: "core" },
          { id: "store", label: "Supabase", col: 5, row: 2, kind: "store" },
          { id: "attrib", label: "Attribution", sub: "scoped scoring", col: 6, row: 0, kind: "core" },
          { id: "metrics", label: "Citation Metrics", sub: "share · rank · trend", col: 7, row: 1, kind: "output" },
        ],
        edges: [
          { from: "seeds", to: "score" },
          { from: "score", to: "budget" },
          { from: "budget", to: "apify" },
          { from: "apify", to: "enrich" },
          { from: "enrich", to: "candidates" },
          { from: "enrich", to: "store" },
          { from: "candidates", to: "attrib" },
          { from: "attrib", to: "metrics" },
          { from: "store", to: "metrics" },
          { from: "enrich", to: "score", label: "reliability", dashed: true },
        ],
      },
    },
    challenges: [
      {
        title: "Candidate starvation in the attribution pipeline",
        body:
          "Rows were arriving at enrichment with an empty candidate map, so they could never be attributed — and because support attribution ran before the map was built, it was scoring against the global known-brands set instead. Two bugs compounding: unattributable rows, and the rows that did resolve matching too loosely. The fix was ordering plus a layered fallback — build the map before attribution, and fall through ambiguous candidates, alias hits, content matches, domain/URL tokens, and finally competitors from the active run, so the map is never empty. Attribution then scores only within that map. The failure modes got separated too, because 'no content' and 'weak candidates' need different fixes and had been landing in the same bucket.",
      },
      {
        title: "Spending a crawl budget on the right pages",
        body:
          "A flat page cap produces a blog-heavy corpus, because blogs are what most sites have most of. Typed budgets fix the distribution: per-type slots for pricing, product, use-case, integrations, docs and comparison pages, drained from a ranked list, with a per-prefix diversity cap so one URL subtree can't consume a category. Ranking before the fetch means quality is decided before spend rather than filtered after it.",
      },
      {
        title: "Weighted metrics that survive being aggregated",
        body:
          "Citation share can't be a raw count. It aggregates per (brand, prompt, model) over K generations, then per model with prompt weights, then cross-model with model weights — and the synthetic unattributed brand has to be excluded from the share denominator or every brand's number quietly shrinks. Rank uses competition ranking, so ties share a rank and the next rank skips by the tie-block size.",
      },
      {
        title: "Three social platforms, one authority contract",
        body:
          "Reddit, Quora and YouTube disagree about everything — what a \"post\" is, what engagement means, whether subscribers exist. The temptation is three bespoke pipelines, and then nothing downstream can compare them. Each became a Django app behind its own Airflow DAG, but all three converge on the same two contracts: a deterministic authority score over five weighted signals summing to 1.0, and entity-mention answer units exposed read-only to downstream DAGs. The weights differ per platform because the signals genuinely differ — Reddit has no subscriber-dominant signal like a YouTube channel does, so engagement and content quality carry more there — but the shape is identical, and every component score is explainable rather than a model output nobody can defend.",
      },
      {
        title: "Sizing the browser pool by auditing it, not guessing",
        body:
          "The crawler pool started at 2 browsers, 100 contexts (50 per browser) and 250 pages (5 per context) — sized for throughput on paper. Production disagreed: crawls were returning zero pages with a queue_exhausted classification, and the cause wasn't obvious from either the queue or the pool in isolation. I wrote the pool audit as a read-only document first — what creates what, who drains whom, where the retry actually lives — before changing a line. The answer was that the tiers were provisioned far past what a browser could keep healthy, so contexts came down 5× to 20 and pages to 25. Writing the audit before the fix is what kept it from being a guess-and-retune loop.",
      },
      {
        title: "Auditing a migration instead of trusting it",
        body:
          "When the pipeline moved from the backend engine into Airflow DAGs, the execution shell and basic enrichment came across but the intelligence layer largely didn't — no discovery, no scoring, no typed budgeting. I audited it metric by metric against the original as the truth source and scored completeness at 38%, which is a far more useful number to hand someone than 'mostly migrated'. The gaps that mattered were the silent ones: dense-vs-positional rank, a 0–1 share where the old APIs returned 0–100.",
      },
    ],
    stack: [
      { group: "Backend", items: ["FastAPI", "Django REST", "Railway", "Supabase", "PostgreSQL"] },
      { group: "Pipelines", items: ["Airflow", "Celery", "Apify", "Modal", "S3 artifacts"] },
      { group: "Crawling", items: ["Playwright", "Apify", "Browser pooling"] },
      { group: "Extraction", items: ["YAKE", "Page-type classification"] },
      { group: "Sources", items: ["Reddit", "Quora", "YouTube"] },
      { group: "Infra", items: ["Docker Compose", "Traefik", "Gunicorn", "nginx"] },
    ],
    results: [
      "Primary author of the citation attribution engine — 76 of 92 commits in the citations package — normalising extraction across 5 LLM provider families plus Google AI Overviews behind one registry, gated on retrieved grounding so ungrounded URLs never score.",
      "Sole author of the Reddit, Quora and YouTube intelligence pipelines: three Django apps behind their own Airflow DAGs (YouTube alone is 17 tasks), with deterministic 5-signal authority scoring and read-only answer-unit contracts downstream.",
      "Built the crawler's discovery, scoring, selection and budgeting layers — sitemap and DOM discovery, an adaptive pass, Apify fallback, canonical dedupe with locale normalisation and robots gating, and typed slot allocation.",
      "Implemented the citation metric set powering the Insights Engine — mass-weighted brand share, competition-ranked position, per-model availability, and domain, page and daily-trend tables.",
      "Drove the Airflow migration and took the platform to production: containerised the Django + Celery + Airflow stack, then hardened the deploy — Gunicorn, locked-down Traefik, internal services off the host network, request-time nginx upstream DNS.",
      "Migrated the crawler and insights services from Encore TypeScript to FastAPI on Railway with Supabase, dispatching heavy stages to Modal serverless, while the pipeline kept collecting.",
      "Closed a cross-brand-set data leak that surfaced out-of-scope competitors in customer-facing citation results.",
    ],
    lessons: [
      "Ordering is a correctness property, not a performance one. Candidate starvation wasn't a scoring bug — the scorer was fine, it just ran before the data it needed existed.",
      "Constrain the search space before you score it. Attribution against a global brand set always finds something; attribution scoped to a candidate map can honestly return nothing, and being able to return nothing is what makes the matches worth anything.",
      "Grade a migration against the original as the truth source, metric by metric. 'It runs' and 'it agrees with what it replaced' are very different claims, and only the second one is worth making.",
      "Write the audit before the fix. The pool was oversized 5× and the symptom was zero-page crawls; reading the system end to end on paper first turned what would have been a guess-and-retune loop into one change.",
      "Platforms that share nothing still need to share a contract. Three bespoke social pipelines would have been easier to write and impossible to compare — the per-platform weights differ, but the five-signal shape and the answer-unit interface don't.",
    ],
    timeline: [
      { when: "Feb 2026", what: "Joined Gravton Labs as AI Engineer intern; moved the crawler in and got it running end to end." },
      { when: "Feb – Mar 2026", what: "Crawler discovery, URL scoring, typed crawl budgeting and the pool audit." },
      { when: "Mar – Apr 2026", what: "Citation attribution: candidate map, scoped scoring, failure taxonomy, metrics and endpoints." },
      { when: "Apr – May 2026", what: "Airflow migration and containerisation; metric parity audit; citation and crawl DAGs to production." },
      { when: "May – Jun 2026", what: "YouTube, Reddit and Quora intelligence pipelines; production deploy hardening." },
    ],
    links: [{ label: "Resume", href: "/resume.pdf" }],
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
      "A production document-intelligence platform for U.S. tax documents, processing 10K+ pages a month end to end. Tax paperwork is the hard case for parsing: the same logical form arrives as a clean PDF, a phone photo, or a scan with handwriting in the margin, and the layout shifts between issuers.",
    problem:
      "CPA firms were reviewing every page by hand because no single extraction method survives the variance in real tax documents. Pure OCR loses structure, pure layout models miss handwriting, and an LLM on raw text is expensive and unreliable at scale.",
    architecture: {
      summary:
        "A hybrid pipeline routes each page rather than committing to one extractor: OCR and CV layout detection handle structured pages, multimodal encoders handle the visually complex ones, and an LLM fallback catches what the earlier stages can't resolve. Extracted content is chunked — semantic, recursive and hybrid — for long-document retrieval.",
      diagram: {
        caption: "Tax CPA Parser — page routing and retrieval",
        nodes: [
          { id: "doc", label: "Tax Document", col: 0, row: 1, kind: "input" },
          { id: "layout", label: "CV Layout Detection", col: 1, row: 0, kind: "core" },
          { id: "ocr", label: "OCR", col: 1, row: 1, kind: "core" },
          { id: "mm", label: "Multimodal Encoder", col: 1, row: 2, kind: "model" },
          { id: "router", label: "Fallback Router", col: 2, row: 1, kind: "core" },
          { id: "llm", label: "LLM Fallback", col: 3, row: 2, kind: "model" },
          { id: "chunk", label: "Chunking", sub: "semantic · recursive · hybrid", col: 3, row: 0, kind: "core" },
          { id: "rag", label: "Long-doc RAG", col: 4, row: 1, kind: "output" },
        ],
        edges: [
          { from: "doc", to: "layout" },
          { from: "doc", to: "ocr" },
          { from: "doc", to: "mm" },
          { from: "layout", to: "router" },
          { from: "ocr", to: "router" },
          { from: "mm", to: "router" },
          { from: "router", to: "llm", dashed: true, label: "unresolved" },
          { from: "router", to: "chunk" },
          { from: "llm", to: "chunk" },
          { from: "chunk", to: "rag" },
        ],
      },
    },
    challenges: [
      {
        title: "No single extractor is enough",
        body:
          "The pipeline is hybrid because every individual method has a document class it fails on. The engineering is in the routing — deciding per page which extractor to trust, and when to pay for the LLM fallback.",
      },
      {
        title: "Retrieval over long documents",
        body:
          "Naive fixed-size chunking destroys the structure that makes a tax document answerable. Moving to semantic, recursive and hybrid chunking lifted long-document RAG accuracy by 20–30%.",
      },
      {
        title: "Extending the in-house parser past the formats it was built for",
        body:
          "od-parse handled PDFs and images. The documents that actually arrived included spreadsheets, decks, Word files and CAD drawings, and each one routed to a stage that didn't exist. I extended it with Excel, DOCX and PPTX pipelines, embedded-image extraction and an image-enhancement preprocessing pass, behind a router that triages a PDF as vector or raster before choosing a path — the two cases want completely different extractors, and guessing wrong is silent. It shipped as a Dockerized FastAPI service so the library stopped being something each caller vendored and became one endpoint.",
      },
      {
        title: "Mechanical drawings: detection is fast, verification is right",
        body:
          "Engineering drawings are dense with small annotations, and the two obvious approaches each fail on their own. A specialised detector is fast and finds most annotations but can't read them; a multimodal model reads them but is expensive and misses things at full-page scale. The pipeline runs three stages instead: Roboflow detects candidate annotations, Gemini verifies and parses the cropped patches, and a final full-image scan catches what detection missed entirely. The catch was rate limiting — one API call per patch on a dense drawing means 429s immediately. Batching every patch into a single verification call is what made the middle stage viable at all.",
      },
      {
        title: "Rate limits reshaped the chunking strategy",
        body:
          "The pipeline started returning 429s from Gemini, and the cause was upstream of the API layer: chunking was producing many small pieces, and each piece was a call. The fix inverted the usual instinct — instead of smaller, more careful chunks, enforce a hard ceiling of three chunks per document and let chunk size grow to meet it, doubling iteratively until the count fits. Chunking itself moved to local MiniLM embeddings so semantic splitting costs no API calls at all, with a minimum sentence count per chunk to stop fragmentation and a semaphore capping parallel calls. Fewer, larger chunks suit a long-context model anyway; the rate limit just forced the realisation.",
      },
      {
        title: "Merging chunk results without corrupting the totals",
        body:
          "Splitting a document means recombining its extractions, and the correct merge depends on what the document is. Income figures across chunks of a tax form should sum. Invoice totals must not — the same total often appears in several chunks, so summing double-counts it and taking the maximum is right. Bank statements combine transaction lists; medical records merge chronologically. A generic recursive merge quietly produces plausible, wrong numbers on half of these, and it does it silently, which is the part that matters.",
      },
      {
        title: "Domain semantics that no general parser knows",
        body:
          "Documents were being filed under the wrong year, intermittently, and it wasn't an extraction bug — the extraction was correct. A 1040 belongs to the tax year it's filed for; a W-2 for that same tax year is issued the following calendar year and belongs under the issuance year; an identity document belongs to the year it was processed. One naming rule cannot serve all three, so the year became a per-document-type decision with the original filename as a hint and a guaranteed fallback so a failed extraction can't wedge the pipeline. This is the kind of requirement that only surfaces from the domain, never from the data.",
      },
      {
        title: "Instrumenting a pipeline other people depend on",
        body:
          "Once firms were relying on throughput, 'it worked' stopped being a sufficient report. Every document emits processing time, size, type, chunk count and typed error; every run rolls those into success rates, error-type breakdowns and per-type volumes. Failures are isolated so one bad document doesn't abort a batch, with retries on exponential backoff. The point of the typed errors is triage — a spike in one error class on one document type is a different Monday from a general rise in latency.",
      },
    ],
    stack: [
      { group: "Document AI", items: ["OCR", "CV layout detection", "Multimodal encoders", "Gemini 2.5 Flash", "Roboflow"] },
      { group: "Chunking", items: ["Chonkie", "Semantic chunking", "all-MiniLM-L6-v2"] },
      { group: "Pipeline", items: ["Prefect", "LlamaParse", "FastAPI", "Docker"] },
      { group: "Backend", items: ["Python", "Google Cloud Storage"] },
    ],
    results: [
      "10K+ pages processed per month, end to end.",
      "Long-document RAG accuracy up 20–30% via semantic, recursive and hybrid chunking.",
      "Onboarded 10+ U.S. CPA firms, cutting manual review time by 40%+.",
      "Extended od-parse, the in-house parser, from PDF/image to Excel, DOCX, PPTX and CAD vector formats behind an intelligent router with vector-vs-raster PDF triage — shipped as a Dockerized FastAPI service.",
      "Built od-parse's mechanical-drawing pipeline: Roboflow detection, batched Gemini multimodal verification, and a full-image rescan recovering annotations the detector missed.",
    ],
    lessons: [
      "Fix rate limits at the layer that causes them. The 429s looked like an API problem and were a chunking-strategy problem; retry logic would have made them slower and permanent.",
      "The dangerous merge bug is the one that produces a plausible number. Summing invoice totals across chunks yields a real-looking figure that's simply wrong, and nothing downstream flags it.",
      "Domain rules don't appear in the data. Nothing in a W-2 says it should be filed under its issuance year rather than its tax year — that came from understanding how firms actually work.",
      "A prototype needs to work; a production pipeline needs to explain itself. Typed errors and per-run metrics were what turned failures into something diagnosable rather than something to re-run and hope.",
    ],
    timeline: [
      { when: "Oct 2025", what: "Joined OctonData as primary engineer on document intelligence." },
      { when: "Oct – Dec 2025", what: "Hybrid parsing pipeline and chunking strategies." },
      { when: "Dec 2025", what: "10+ CPA firms onboarded in production." },
    ],
    links: [{ label: "Resume", href: "/resume.pdf" }],
    related: ["gravton", "medproqa"],
  },

  /* ---------------------------------------------------------------- */
  reach: {
    id: "reach",
    title: "R.E.A.C.H.",
    tier: "featured",
    role: "Co-founder & AI Lead",
    period: "Apr 2025 – Present",
    context: "IITM Nirmaan cohort",
    tagline: "AI-powered emergency response platform",
    milestone: "building",

    overview:
      "An emergency response platform built out of the IITM Nirmaan startup cohort. Emergency calls are the worst possible input for speech models — noise, panic, cross-talk, accents — and the output has to be trustworthy enough to dispatch against.",
    problem:
      "Emergency dispatch depends on a human parsing a distressed call in real time. Transcription that degrades under noise, and no automated way to flag spoofed calls, makes that pipeline both slow and abusable.",
    architecture: {
      summary:
        "Whisper fine-tuned on noisy emergency audio produces real-time transcription; BART summarises the call for the dispatcher; a spoof-detection model flags likely false reports. Dispatch and responder tracking run over WebSockets with the Maps API under low-latency constraints.",
      diagram: {
        caption: "R.E.A.C.H. — call to dispatch",
        nodes: [
          { id: "call", label: "Emergency Call", col: 0, row: 1, kind: "input" },
          { id: "whisper", label: "Whisper", sub: "fine-tuned, noisy audio", col: 1, row: 1, kind: "model" },
          { id: "bart", label: "BART", sub: "summarisation", col: 2, row: 0, kind: "model" },
          { id: "spoof", label: "Spoof Detection", col: 2, row: 2, kind: "model" },
          { id: "dispatch", label: "SOS Dispatch", sub: "WebSockets", col: 3, row: 1, kind: "core" },
          { id: "track", label: "Responder Tracking", sub: "Maps API", col: 4, row: 1, kind: "output" },
        ],
        edges: [
          { from: "call", to: "whisper" },
          { from: "whisper", to: "bart" },
          { from: "whisper", to: "spoof" },
          { from: "bart", to: "dispatch" },
          { from: "spoof", to: "dispatch", label: "flag" },
          { from: "dispatch", to: "track" },
        ],
      },
    },
    challenges: [
      {
        title: "Transcription under real noise",
        body:
          "Off-the-shelf Whisper degrades badly on emergency audio. Fine-tuning on noisy calls was the only way to get transcription usable in real time.",
      },
      {
        title: "Low-latency dispatch",
        body:
          "Real-time SOS dispatch and responder tracking over WebSockets and the Maps API, under latency constraints where a slow update is a failed feature.",
      },
      {
        title: "Leading a team to MVP",
        body:
          "Selected from 200+ startups by IITM NIRMAAN; led a 5-member cross-functional team from concept to a working MVP.",
      },
    ],
    stack: [
      { group: "Speech & NLP", items: ["Whisper", "BART", "Fine-tuning"] },
      { group: "Realtime", items: ["WebSockets", "Maps API"] },
    ],
    results: [
      "Spoof detection at 78% precision on emergency call audio.",
      "Selected from 200+ startups by IITM NIRMAAN.",
      "Led a 5-member cross-functional team to MVP.",
    ],
    lessons: [
      "A latency budget is a design constraint, not a tuning target. Dispatch and responder tracking had to be architected around real-time delivery from the start — a slow update isn't a degraded feature here, it's a failed one.",
      "Off-the-shelf models assume clean inputs. Whisper was unusable on real emergency audio until it was fine-tuned on the noise it would actually meet, which is the whole gap between a demo and a system.",
      "On a cross-functional team the risk moves into the seams. The components were tractable; keeping speech, realtime and front-end aligned on one contract is what decided whether an MVP existed.",
    ],
    timeline: [
      { when: "Apr 2025", what: "Founded; selected into the IITM Nirmaan cohort." },
      { when: "2025", what: "Whisper fine-tuning, BART summarisation, spoof detection." },
      { when: "Present", what: "Ongoing." },
    ],
    links: [{ label: "Resume", href: "/resume.pdf" }],
    related: ["medproqa", "smartfan"],
  },

  /* ---------------------------------------------------------------- */
  medproqa: {
    id: "medproqa",
    title: "MedProQA",
    tier: "archive",
    role: "Solo Developer",
    period: "Jul 2025",
    context: "Personal project",
    tagline: "Fine-tuned Phi-3 for medical question answering",
    milestone: "building",

    overview:
      "A fine-tuned LLM for medical question answering, built to learn the full training loop end to end — data curation, quantised fine-tuning, and honest evaluation including out-of-distribution behaviour.",
    problem:
      "Medical QA punishes hallucination more than most domains, and full fine-tuning of a capable base model was out of reach on available hardware.",
    architecture: {
      summary:
        "250K+ QA pairs curated from MedQA, MedMCQA and PubMedQA through schema normalisation and dedup pipelines, then used to fine-tune Phi-3 with QLoRA 4-bit quantisation. Evaluation covered both in-distribution accuracy and out-of-distribution hallucination rate.",
      diagram: {
        caption: "MedProQA — corpus to evaluated model",
        nodes: [
          { id: "src", label: "MedQA · MedMCQA · PubMedQA", col: 0, row: 1, kind: "input" },
          { id: "norm", label: "Schema Normalisation", sub: "+ dedup", col: 1, row: 1, kind: "core" },
          { id: "corpus", label: "250K+ QA Pairs", col: 2, row: 1, kind: "store" },
          { id: "phi", label: "Phi-3", col: 2, row: 0, kind: "model" },
          { id: "qlora", label: "QLoRA 4-bit", col: 3, row: 1, kind: "core" },
          { id: "eval", label: "Evaluation", sub: "in- and out-of-distribution", col: 4, row: 1, kind: "output" },
        ],
        edges: [
          { from: "src", to: "norm" },
          { from: "norm", to: "corpus" },
          { from: "corpus", to: "qlora" },
          { from: "phi", to: "qlora" },
          { from: "qlora", to: "eval" },
        ],
      },
    },
    challenges: [
      {
        title: "Training within a memory budget",
        body:
          "QLoRA 4-bit quantisation cut GPU memory by 38% and training cost by 24% against full fine-tuning — the difference between the project being possible and not.",
      },
      {
        title: "Curating three inconsistent corpora",
        body:
          "MedQA, MedMCQA and PubMedQA don't share a schema. Normalisation and dedup pipelines were needed before any of it could be trained on.",
      },
    ],
    stack: [
      { group: "Model", items: ["Phi-3", "QLoRA", "PyTorch"] },
      { group: "Data", items: ["MedQA", "MedMCQA", "PubMedQA", "Dedup pipelines"] },
    ],
    results: [
      "82.6% accuracy on MedMCQA.",
      "Hallucination rate down 28% on out-of-distribution queries.",
      "38% less GPU memory and 24% lower training cost vs full fine-tuning.",
    ],
    lessons: [
      "Deduplicate before you benchmark. MedQA, MedMCQA and PubMedQA overlap, and any leakage between the training mix and the eval set would have inflated the 82.6% into a number that meant nothing.",
      "One accuracy figure on a benchmark that resembles your training data doesn't describe the model. Tracking hallucination rate on out-of-distribution queries as a separate metric is what showed whether anything had actually generalised.",
      "Quantisation decided whether the project existed. 38% less memory and 24% lower cost wasn't an optimisation pass — it was the difference between training this and not.",
    ],
    timeline: [{ when: "Jul 2025", what: "Built and evaluated." }],
    links: [{ label: "Resume", href: "/resume.pdf" }],
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
    tagline: "AI brand intelligence and share-of-voice tracker",
    milestone: "building",

    overview:
      "An automated brand-intelligence pipeline tracking sentiment and share of voice across Twitter, YouTube and Google. The direct ancestor of the GEO retrieval work later built at Gravton Labs.",
    problem:
      "Tracking how a brand is discussed across platforms is a data-collection problem before it's a model problem — different APIs, different rate limits, different content shapes, all needing one comparable sentiment signal.",
    architecture: {
      summary:
        "n8n orchestrates collection across Twitter, YouTube and Google APIs; Gemini 2.5 Flash does multimodal entity tagging and sentiment scoring; results aggregate into share-of-voice dashboards.",
      diagram: {
        caption: "SmartFan — collection to share of voice",
        nodes: [
          { id: "apis", label: "Twitter · YouTube · Google", col: 0, row: 1, kind: "input" },
          { id: "n8n", label: "n8n Orchestration", col: 1, row: 1, kind: "core" },
          { id: "gemini", label: "Gemini 2.5 Flash", sub: "entity tagging · sentiment", col: 2, row: 1, kind: "model" },
          { id: "agg", label: "Aggregation", col: 3, row: 1, kind: "core" },
          { id: "dash", label: "Share-of-Voice Dashboard", col: 4, row: 1, kind: "output" },
        ],
        edges: [
          { from: "apis", to: "n8n" },
          { from: "n8n", to: "gemini" },
          { from: "gemini", to: "agg" },
          { from: "agg", to: "dash" },
        ],
      },
    },
    challenges: [
      {
        title: "One sentiment signal across three platforms",
        body:
          "Multimodal entity tagging and sentiment scoring with Gemini 2.5 Flash reached 87% F1 on a hand-labelled evaluation set — the hand-labelling being what made the number trustworthy.",
      },
    ],
    stack: [
      { group: "Model", items: ["Gemini 2.5 Flash"] },
      { group: "Pipelines", items: ["n8n", "Twitter API", "YouTube API", "Google APIs"] },
    ],
    results: [
      "87% F1 on a hand-labelled sentiment evaluation set.",
      "Architecture directly informed the GEO retrieval pipelines later built at Gravton Labs.",
    ],
    lessons: [
      "Hand-labelling the evaluation set is what makes the number mean anything. 87% F1 is only a claim because the ground truth was built by hand rather than inherited from another model's output.",
      "One signal across three platforms needs a normalisation layer before it needs a model. The platforms disagree on structure, length and tone, and a tagger applied to raw feeds is really learning the platform, not the sentiment.",
      "This was the first version of a problem I'd get to solve properly later — the ingestion here fed the crawler at Gravton, where the missing piece turned out to be deciding what's worth fetching before fetching it.",
    ],
    timeline: [{ when: "Aug 2025", what: "Built end to end." }],
    links: [{ label: "Resume", href: "/resume.pdf" }],
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
    tagline: "2D robot navigation — four RRT variants, benchmarked",
    milestone: "foundations",

    overview:
      "An implementation and benchmark of four RRT variants for 2D robot navigation, with custom collision detection, path optimisation, and visualisation tooling — the same class of planner as the vacuum bot roaming this room.",
    problem:
      "Sampling-based planners are easy to implement and hard to compare. Narrow passages and moving obstacles separate the variants, and nothing shows that without a consistent benchmark harness.",
    architecture: {
      summary:
        "Four RRT variants share one collision-detection and simulation substrate, then run against generated environments including narrow passages and dynamic obstacles. A smoothing pass optimises the raw path; visualisation tools render the tree as it grows.",
      diagram: {
        caption: "RRT — sampling to optimised path",
        nodes: [
          { id: "env", label: "Environment", sub: "narrow passages · moving obstacles", col: 0, row: 1, kind: "input" },
          { id: "sample", label: "Sampler", col: 1, row: 1, kind: "core" },
          { id: "collide", label: "Collision Detection", col: 2, row: 0, kind: "core" },
          { id: "tree", label: "RRT Variants", sub: "×4", col: 2, row: 1, kind: "core" },
          { id: "smooth", label: "Path Smoothing", col: 3, row: 1, kind: "core" },
          { id: "bench", label: "Benchmark", sub: "1000+ runs", col: 4, row: 1, kind: "output" },
        ],
        edges: [
          { from: "env", to: "sample" },
          { from: "sample", to: "tree" },
          { from: "collide", to: "tree" },
          { from: "tree", to: "smooth" },
          { from: "smooth", to: "bench" },
        ],
      },
    },
    challenges: [
      {
        title: "Making variants comparable",
        body:
          "Benchmarking four planners over 1000+ runs only means something if collision detection and the environment generator are identical across them.",
      },
    ],
    stack: [
      { group: "Core", items: ["Python", "NumPy"] },
      { group: "Robotics", items: ["RRT variants", "Collision detection", "Path optimisation"] },
    ],
    results: [
      "98% success rate across 1000+ runs.",
      "Path length reduced 27% via smoothing.",
      "Runtime reduced 41% vs baseline RRT.",
    ],
    lessons: [
      "A comparison is only as trustworthy as what's held fixed. Four planners over 1000+ runs says nothing unless collision detection and the environment generator are byte-identical across every arm — otherwise you're measuring the harness.",
      "Run counts exist to beat variance. On randomised planners a handful of runs can rank the variants in any order you like; the sample size is what turns 41% faster into a claim rather than an anecdote.",
      "Improvements trade against each other and have to be reported together. Smoothing cut path length 27%, and quoting that without the runtime it costs would be a half-truth.",
    ],
    timeline: [{ when: "Dec 2024 – Jan 2025", what: "Implemented, benchmarked and visualised." }],
    links: [{ label: "Resume", href: "/resume.pdf" }],
    related: ["medproqa"],
  },
};

export const FEATURED: ProjectId[] = ["ancora", "tinyserve", "senpai", "toolcalllm", "gravton", "tax-cpa-parser", "reach"];
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
  impact: string;
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
      "B.Tech, Chemical Engineering — IIT Madras (2023 – 2027), GPA 8.64",
      "Deep Learning Specialization (Andrew Ng)",
      "Practical Deep Learning (fast.ai)",
      "Mathematics for ML",
    ],
    tech: ["Python", "C++", "NumPy", "Algorithms", "Simulation"],
    lessons: [
      "A planner that works on a clean map and fails in a narrow passage isn't a working planner — the benchmark is the product.",
    ],
    impact: "98.61 percentile in JEE Mains among 1.2M+ candidates; Top 450 in WBJEE; AIR 71 (Junior Squad), Technothlon.",
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
    alsoShipped: ["LLM Fine-Tuning & Optimization", "Generative AI for LLMs", "Full-Stack Development"],
    tech: ["PyTorch", "Whisper", "BART", "Phi-3", "QLoRA", "Gemini", "n8n", "WebSockets"],
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
      "Qwen3-VL for tables, figures and charts; Gemma embeddings into ChromaDB",
    ],
    tech: ["YOLOv10", "PaddleOCR", "Qwen3-VL", "ChromaDB", "Gemma embeddings"],
    lessons: [
      "Document AI is a routing problem — no single extractor survives real-world input variance.",
    ],
    impact: "Ranked Top 20 nationally for solo pipeline contribution; Tecnod8 named to Forbes India Select 200 during tenure.",
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
      "Throughput is an architecture property — caching and parallel execution moved it 5×, not a bigger machine.",
    ],
    impact: "97% BFCL single-turn accuracy; 50K+ synthetic training examples; 5× inference throughput (11 → 55 tok/s).",
  },
  {
    id: "current",
    glyph: "07",
    chapter: "Current Focus",
    period: "2026 – 2027",
    became: todo("What are you becoming next? One line, in your own words."),
    summary:
      "Placement preparation alongside continued work on AI systems, split across two personal runtimes. Ancora makes losing a multi-step computation to a dead worker structurally impossible, proven with chaos experiments that assert rather than demonstrate. TinyServe takes the same scheduling instincts — admission control, fair queuing, backpressure — and applies them to LLM inference, built from scratch on llama.cpp at a scale where every latency number traces back to a specific decision in the code.",
    projects: ["ancora", "tinyserve"],
    alsoShipped: [
      "Ancora — fault-tolerant runtime for durable AI workflows (Temporal + Ray), open source",
      "TinyServe — from-scratch LLM inference runtime on llama.cpp, open source",
      "Placement preparation",
      "AI systems and distributed systems",
    ],
    tech: ["Temporal", "Ray", "Distributed Systems", "OpenTelemetry", "Chaos Engineering", "llama.cpp", "Continuous Batching", "Prometheus", "Grafana"],
    lessons: [
      "Durability and liveness are different guarantees. Temporal keeps your state through any crash; only spare capacity turns that into progress.",
      "A fault-tolerance claim needs a test that asserts it, not a demo that shows it once.",
      "The same scheduling primitives — admission control, fair queuing — apply whether the resource being rationed is worker-seconds or KV-cache memory; only the substrate changes.",
    ],
    impact:
      "Ancora: three durability invariants machine-checked from Temporal history after a real SIGKILL, kill-detection cut 9.5× to ~6s, 284 tests green. TinyServe: WFQ bounds scheduling unfairness 2.54× vs strict Priority's 3.87×, admission control verified live under burst load, 97.2% of wall time profiled inside llama_decode(). B.Tech completes 2027.",
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
