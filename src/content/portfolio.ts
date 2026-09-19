/**
 * All portfolio content, distilled from the résumé, in one place.
 * The 3D room is the navigation; this file is the substance. Each section
 * is anchored to an object in the room (OBJECT_SECTION below) — arriving
 * at that object reveals the section's panel.
 *
 * SOURCE OF TRUTH: my_resume/resume/*.tex (the LaTeX section files), NOT
 * the built PDF and not docs/my_resume.pdf, which is a stale export. When
 * the résumé changes, the facts below are what needs re-checking against
 * it: EXPERIENCE, SKILLS, ACHIEVEMENTS and COURSEWORK each mirror a
 * section file. Where the résumé prunes something purely to fit its line
 * budget, the note on that field says so — the site has no such limit.
 */

export const PROFILE = {
  name: "Ritankar Mondal",
  tagline: "AI Engineer · IIT Madras",
  // Mirrors resume/summary.tex (the \mlonly branch).
  summary:
    "AI and LLM engineer with 10 months across four industry internships, shipping both the model and the AI systems that keep it running. Fine-tunes, benchmarks and serves tool-calling LLMs on constrained GPU hardware, and builds the fault-tolerant, observable distributed infrastructure underneath them.",
  email: "ritankarmondal123@gmail.com",
  // Built from my_resume/resume_offcampus.tex — the off-campus variant, which
  // leads with work rather than marks: no grade figures and no Achievements
  // section. Every download link in the site routes through this one constant,
  // so there is a single place to repoint if the served variant ever changes.
  resumeUrl: "/resume_offcampus.pdf",
} as const;

/* ------------------------------------------------------------------ */

export interface Project {
  title: string;
  role: string;
  period: string;
  context?: string;
  bullets: string[];
  tags: string[];
}

export const PROJECTS: Project[] = [
  {
    title: "MedProQA",
    role: "Solo Developer",
    period: "Jul 2025",
    context: "Fine-tuned LLM for medical question answering",
    bullets: [
      "Fine-tuned Phi-3 with QLoRA 4-bit quantization — 38% less GPU memory, 24% lower training cost vs full fine-tuning.",
      "Curated 250K+ medical QA pairs from MedQA, MedMCQA and PubMedQA with schema normalization and dedup pipelines.",
      "82.6% accuracy on MedMCQA; hallucination rate down 28% on out-of-distribution queries.",
    ],
    tags: ["Phi-3", "QLoRA", "PyTorch", "Evaluation"],
  },
  {
    title: "R.E.A.C.H.",
    role: "Co-founder & AI Lead",
    period: "Apr 2025 – Aug 2026",
    context: "AI-powered emergency response platform · IITM Nirmaan cohort",
    // BART summarisation and "spoof detection at 78% precision" were removed
    // 2026-09-16: neither exists in reach-app or reach-asr (the only hits for
    // either term are in node_modules), and no artefact produces the 78%
    // figure. The résumé dropped both for the same reason. Replaced with the
    // measured WER pair from reach-asr/README.md.
    bullets: [
      "LoRA fine-tuned Whisper for telephony-band noisy speech on a *synthetic* channel (300-3400 Hz passband, G.711 companding, ESC-50 noise, packet loss): WER 23.76% to 21.20%, 95% CI [-3.85, -1.31].",
      "Measured what the specialisation cost rather than omitting it - clean WER 4.37% to 5.24% - and audited the evaluation's own SNR labelling.",
      "Built real-time SOS dispatch and responder tracking on Socket.IO, OSRM routing and Leaflet/OpenStreetMap - zero paid map infrastructure.",
      "Added a metadata-based fake-report filter validating EXIF GPS against claimed incident locations within 3 km, failing open on stripped metadata.",
      "Selected from 200+ startups by IITM NIRMAAN; led a 5-member cross-functional team to MVP.",
    ],
    tags: ["Whisper", "LoRA", "Socket.IO", "OSRM", "Leadership"],
  },
  {
    title: "SmartFan",
    role: "Solo Developer",
    period: "Aug 2025",
    context: "AI brand intelligence & share-of-voice tracker",
    bullets: [
      "Automated sentiment + share-of-voice pipeline across Twitter, YouTube and Google APIs via n8n orchestration.",
      "Gemini 2.5 Flash for multimodal entity tagging and sentiment scoring — 87% F1 on a hand-labeled evaluation set.",
      "Architecture directly informed the GEO retrieval pipelines later built at Gravton Labs.",
    ],
    tags: ["Gemini", "n8n", "Pipelines", "Dashboards"],
  },
  {
    title: "RRT Path Planning",
    role: "Solo Developer",
    period: "Dec 2024 – Jan 2025",
    context: "2D robot navigation — like the vacuum bot roaming this room",
    bullets: [
      "Implemented and benchmarked 4 RRT variants with custom collision detection and path optimization.",
      "98% success rate across 1000+ runs; path length −27% via smoothing, runtime −41% vs baseline RRT.",
      "Simulated dynamic environments with narrow passages and moving obstacles; built planner visualization tools.",
    ],
    tags: ["Python", "Robotics", "Algorithms", "Simulation"],
  },
];

/* ------------------------------------------------------------------ */

export interface Role {
  company: string;
  title: string;
  location: string;
  period: string;
  bullets: string[];
}

// Mirrors resume/experience.tex (the \mlonly bullet selection), condensed
// only where the whiteboard renders at 19px. Facts, figures and dates are
// the résumé's — if a number here disagrees with experience.tex, this file
// is the one that is wrong.
export const EXPERIENCE: Role[] = [
  {
    company: "Otsuka Corporation",
    title: "AI/ML Engineer Intern",
    location: "Tokyo, Japan · PPO",
    period: "May 2026 – Jul 2026",
    bullets: [
      "Ran 5 controlled LoRA/QLoRA experiments on Qwen3-8B against BFCL v4 (NVIDIA DGX Spark, GB10), establishing data composition, not volume as the central lever for tool-calling SFT — 88.6% 8-category average, 97.0% on simple_python.",
      "Shipped Senpai, a sales copilot on Otsuka's production SPR schema: a deterministic 7-signal deal-health engine plus a tool-calling LLM served on Qwen3.6-35B-A3B-NVFP4; traced repetition-loop degeneration to unset sampling under greedy decode.",
      "Rearchitected Senpai's serving path off a frozen-context A/B — grounded synthesis moved to a Q4 8B (2.72× wall, 3.8× decode, at grounding parity) while tool selection stayed on the 27B, which the 8B could not do reliably.",
      "Root-caused catastrophic FP8 gradient explosion on GB10 (sm_121) after eliminating 8 hypotheses; moved production to Unsloth NF4 QLoRA — 22% faster and 45 GiB lighter than HF+PEFT.",
    ],
  },
  {
    company: "Gravton Labs",
    title: "AI Engineer Intern",
    location: "Ontario, Canada · Remote",
    period: "Feb 2026 – May 2026",
    bullets: [
      "Primary engineer on the citation attribution engine behind a live AI-search-visibility product — extraction normalized across 5 LLM provider families (OpenAI, Anthropic, Gemini, Perplexity, xAI) plus Google AI Overviews behind one registry, gated on retrieved grounding so ungrounded URLs never score.",
      "Sole author of the Reddit, Quora and YouTube intelligence pipelines: three Django apps behind their own Airflow DAGs (YouTube alone is 17 tasks), with deterministic 5-signal community-authority scoring.",
      "Built and owned the production crawler — adaptive discovery (DOM, sitemap, Apify fallback) feeding a best-first scorer over a three-tier pooled Playwright runtime (2 browsers / 100 contexts / 250 pages), later cut 5–10× after auditing pool exhaustion under load.",
      "Drove the Airflow migration and took the platform to production — containerized the Django, Celery and Airflow stack, moved crawl, enrich and citation stages onto scheduled DAGs with idempotent persistence, then hardened the deploy.",
      "Ported the crawler and insights services from Encore TypeScript to FastAPI on Railway over Supabase, dispatching heavy stages to Modal serverless. Both platforms run in production today.",
    ],
  },
  {
    company: "OctonData",
    title: "Software Engineer Intern",
    location: "San Francisco, CA · Remote",
    period: "Oct 2025 – Dec 2025",
    bullets: [
      "Primary engineer on a document intelligence platform on GCP (Cloud Run, Cloud SQL, Cloud Build CI/CD); shipped the Tax CPA Parser to 10+ U.S. CPA firms, cutting manual review time 40%+.",
      "Extended od-parse, the in-house parser, from PDF and image input to Excel, DOCX, PPTX and CAD vector formats behind a classifying router with vector-vs-raster PDF triage; shipped as a Dockerized FastAPI service.",
      "Owned od-parse's mechanical-drawing pipeline — Roboflow annotation detection, batched Gemini multimodal verification, and a full-image rescan recovering annotations the detector missed.",
      "Grounded a CrewAI multi-agent tax analysis system (return analyzer, IRS code researcher, strategy analyst) on Gemini over a semantic chunker — Chonkie plus Gemini embeddings, recursive fallback.",
    ],
  },
  {
    company: "Tecnod8.ai",
    title: "Machine Learning Intern",
    location: "IIT Mandi Incubated · Remote",
    period: "Sep 2025 – Oct 2025",
    bullets: [
      "Built multilingual document parsing across 5+ languages with YOLOv10, PP-DocLayout-L and PaddleOCR — RTL and Devanagari support, ensemble layout inference with rotation handling and adaptive scaling.",
      "Integrated Qwen2.5-VL for table, figure and chart extraction, embedding structured outputs via Gemma into ChromaDB for retrieval.",
      "Trained the detector to bounding-box document structure as distinct classes — titles, section headers, paragraphs, tables and figures — raising accuracy through dataset auditing, active-learning reannotation of low-confidence regions, and per-class error analysis.",
    ],
  },
];

/* ------------------------------------------------------------------ */

export interface SkillGroup {
  label: string;
  items: string[];
}

// Rows and their contents mirror resume/technical skills.tex (\mlonly), which
// holds every row to one rendered line and says "prune before adding". Two
// items are carried over from that file's SDE rows, where they are listed
// against the same shipped code: WebSockets (R.E.A.C.H. Socket.IO, Ancora's
// live dashboard) and OpenTelemetry (Ancora, TinyServe). They are absent from
// the ML rows for line budget, and a terminal panel has no line budget.
export const SKILLS: SkillGroup[] = [
  {
    label: "Languages & Tooling",
    items: ["Python", "C++", "TypeScript", "SQL", "Bash", "Git", "pytest", "uv"],
  },
  {
    label: "ML & Deep Learning",
    items: ["PyTorch", "Transformers", "TRL", "PEFT", "LoRA / QLoRA", "Fine Tuning (SFT)", "Evaluation & Benchmarking"],
  },
  {
    label: "GPU & Training Infra",
    items: ["CUDA", "DGX Spark (GB10)", "Unsloth", "FlashAttention-2", "Transformer Engine", "bitsandbytes"],
  },
  {
    label: "Quantization & Serving",
    items: ["NF4", "BF16", "FP8", "NVFP4", "GGUF / Q4_K_M", "vLLM", "llama.cpp / llama-server"],
  },
  {
    label: "LLM Systems",
    items: ["Tool Calling", "RAG & Hybrid Retrieval", "GraphRAG", "Chonkie", "ChromaDB", "pgvector", "Roboflow"],
  },
  {
    label: "Distributed Systems",
    items: ["Temporal", "Ray", "Event Sourcing", "Airflow", "Celery", "Exactly-Once Semantics"],
  },
  {
    label: "Backend & Web",
    items: ["FastAPI", "Django REST", "PostgreSQL", "Redis", "WebSockets", "Next.js", "React"],
  },
  {
    label: "Infra & Observability",
    items: ["Docker", "GCP", "Modal", "Railway", "Playwright", "CI/CD", "OpenTelemetry", "Prometheus", "Grafana"],
  },
];

/* ------------------------------------------------------------------ */

// No `gpa` field: nothing renders a grade any more (the book and the timeline
// milestone both dropped it, matching the résumé the site serves), and a datum
// with no consumer is how a stale figure creeps back into the UI later.
export const EDUCATION = {
  school: "Indian Institute of Technology Madras",
  degree: "B.Tech in Chemical Engineering",
  period: "2023 – 2027",
} as const;

/**
 * What the boot screen reads out while the room streams in.
 *
 * A loading screen is the one moment a visitor is guaranteed to be
 * looking at the page and unable to do anything else. Spending it on a
 * spinner wastes it — so this is the wait made worth having.
 *
 * These are OPINIONS, not statistics. An earlier version rotated the
 * headline numbers (97% BFCL, 11→55 tok/s, 10K pages/month) and it read
 * like a billboard: impressive, immediately forgotten, and telling a
 * visitor nothing they couldn't get from the résumé. These lines say how
 * the work is thought about, which is the part a portfolio usually
 * cannot get across at all — and it turns out to be the more interesting
 * thing to read while waiting.
 *
 * Every line is quoted VERBATIM from a milestone's `lessons` in work.ts,
 * or from the Achievements book. Nothing here is written for the loading
 * screen; the authenticity rule applies exactly as it does to the case
 * studies. Strings only — the boot screen must not pull in a single
 * extra byte of assets, since anything it loads is one more thing the
 * room is waiting behind.
 */
export const BOOT_NOTES: readonly string[] = [
  "Chemical engineering by degree; AI engineering by obsession.",
  "A system that can honestly return nothing is worth more than one that always returns something.",
  "Most pipeline bugs are ordering bugs.",
  "Evaluation you hand-label yourself is the only evaluation you trust.",
  "Throughput is an architecture property — not a bigger machine.",
  "A fault-tolerance claim needs a test that asserts it, not a demo that shows it once.",
] as const;

// Mirrors resume/acheivements.tex, strongest first. Two corrections came from
// that file: the Willings selection and the Otsuka PPO were missing here
// entirely, and the national ranking was recorded as "Top 20 ... at Tecnod8"
// when it is Top 15 on the NCIIPC challenge leaderboard — a Government of
// India ranking earned on its own, not an outcome of that internship, which is
// why the résumé moved it out of the Tecnod8 entry and this file follows.
// The NIRMAAN line has no counterpart in that section; it is résumé-backed
// from the R.E.A.C.H. project entry.
// Kept to one book page (~380px of column at 15px serif): the résumé carries
// each of these as a full sentence, so the phrasing here is the short form.
// Adding a seventh entry, or a longer one, will overflow the page — check it
// in the book before growing this list.
export const ACHIEVEMENTS: string[] = [
  "Sole selectee from IIT Madras, and the first across all IITs, for the Willings Programme — Japan industry placement, converted to Otsuka in Tokyo with the only intern Pre-Placement Offer",
  "Top 15 nationally — NCIIPC (Govt. of India) Startup India AI Grand Challenge, multilingual document understanding",
  "Selected from 200+ startups by IITM NIRMAAN (R.E.A.C.H.)",
  "98.61 percentile in JEE Mains among 1.2M+ candidates",
  "Top 450 in WBJEE",
  "AIR 71 (Junior Squad) and City Topper — Technothlon Prelims",
];

// Mirrors resume/courses.tex, in that file's \mlonly order. "Full-Stack
// Development" is gone because the résumé dropped it deliberately (React and
// Next.js already appear under skills). fast.ai is kept although courses.tex
// does not list it — nothing there contradicts it, and dropping a real
// credential to match a document that merely omits it loses information.
export const COURSEWORK: string[] = [
  "LLM Fine-Tuning & Optimization",
  "Generative AI with LLMs (DeepLearning.AI)",
  "Machine Learning in Production (MLOps)",
  "AI Agents (Hugging Face)",
  "Mathematics for ML (Linear Algebra)",
  "Deep Learning Specialization (Andrew Ng)",
  "Probability & Statistics for ML (DeepLearning.AI)",
  "Node.js, Express & MongoDB (Backend Bootcamp)",
  "Practical Deep Learning (fast.ai)",
];

/* ------------------------------------------------------------------ */

export type SectionId =
  | "projects"
  | "experience"
  | "skills"
  | "achievements"
  | "about"
  | "contact";

/** which room object opens which section */
export const OBJECT_SECTION: Record<string, SectionId> = {
  monitor: "projects",
  whiteboard: "experience",
  "server-rack": "skills",
  bookshelf: "achievements",
  window: "about",
  laptop: "contact",
};

export const SECTION_TITLES: Record<SectionId, string> = {
  projects: "Projects",
  experience: "Experience",
  skills: "Technical Skills",
  achievements: "Achievements & Education",
  about: "About",
  contact: "Contact",
};
