/**
 * All portfolio content, distilled from docs/my_resume.pdf, in one place.
 * The 3D room is the navigation; this file is the substance. Each section
 * is anchored to an object in the room (OBJECT_SECTION below) — arriving
 * at that object reveals the section's panel.
 */

export const PROFILE = {
  name: "Ritankar Mondal",
  tagline: "AI Engineer · IIT Madras",
  summary:
    "AI engineer building LLM-powered applications, retrieval systems, and production backend infrastructure — tool-calling models, document intelligence, RAG pipelines, and cloud-native services, with hands-on model training, evaluation, and deployment.",
  email: "ritankarmondal123@gmail.com",
  resumeUrl: "/resume.pdf",
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
    period: "Apr 2025 – Present",
    context: "AI-powered emergency response platform · IITM Nirmaan cohort",
    bullets: [
      "Fine-tuned Whisper on noisy emergency calls for real-time transcription; BART summarization + spoof detection at 78% precision.",
      "Real-time SOS dispatch and responder tracking over WebSockets and Maps API under low-latency constraints.",
      "Selected from 200+ startups by IITM NIRMAAN; led a 5-member cross-functional team to MVP.",
    ],
    tags: ["Whisper", "BART", "WebSockets", "Leadership"],
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

export const EXPERIENCE: Role[] = [
  {
    company: "Otsuka Corporation",
    title: "Software Development Engineer Intern",
    location: "Tokyo, Japan",
    period: "May 2026 – Jul 2026",
    bullets: [
      "Built synthetic-data pipelines producing 50K+ function-calling examples for open-source LLM training.",
      "QLoRA fine-tuning + automated evals for Qwen3-8B — 97% BFCL accuracy on single-turn function calling, on NVIDIA DGX Spark.",
      "Architected Senpai, an enterprise AI execution platform: planner-driven capability graphs, dependency-aware DAGs, GraphRAG.",
      "5× inference throughput (11 → 55 tok/s) via prefix caching, persistent context caching and parallel execution.",
    ],
  },
  {
    company: "Gravton Labs",
    title: "AI Engineer Intern",
    location: "Ontario, Canada · Remote",
    period: "Feb 2026 – May 2026",
    bullets: [
      "GEO retrieval pipelines across Reddit and Quora — SERP-driven discovery, Apify extraction, Airflow DAG orchestration.",
      "Migrated backend from Encore TypeScript to FastAPI microservices on Railway with Supabase.",
      "Citation attribution and AI-visibility metrics powering the Insights Engine for brand monitoring across LLM content.",
    ],
  },
  {
    company: "OctonData",
    title: "Software Engineer Intern",
    location: "San Francisco, CA · Remote",
    period: "Oct 2025 – Dec 2025",
    bullets: [
      "Primary engineer on a document intelligence platform processing 10K+ pages/month end to end.",
      "Hybrid parsing pipeline — OCR, CV layout detection, multimodal encoders, LLM fallback routing — for variable tax documents.",
      "Long-document RAG accuracy up 20–30% via semantic, recursive and hybrid chunking.",
      "Shipped a production Tax CPA Parser; onboarded 10+ U.S. CPA firms, cutting manual review time 40%+.",
    ],
  },
  {
    company: "Tecnod8.ai",
    title: "Machine Learning Intern",
    location: "Remote",
    period: "Sep 2025 – Oct 2025",
    bullets: [
      "Multilingual document parsing (5+ languages, RTL + Devanagari) with YOLOv10, PP-DocLayout-L and PaddleOCR.",
      "Qwen3-VL for tables, figures and charts; Gemma embeddings into ChromaDB for downstream retrieval.",
      "Ranked Top 20 nationally for solo pipeline contribution; Tecnod8 named to Forbes India Select 200 during tenure.",
    ],
  },
];

/* ------------------------------------------------------------------ */

export interface SkillGroup {
  label: string;
  items: string[];
}

export const SKILLS: SkillGroup[] = [
  { label: "Languages", items: ["Python", "C++", "JavaScript", "Bash"] },
  {
    label: "LLM & ML",
    items: ["PyTorch", "Transformers", "QLoRA / LoRA / PEFT", "Instruction Tuning", "Tool & Function Calling"],
  },
  {
    label: "Retrieval",
    items: ["LangChain", "FAISS", "ChromaDB", "Hybrid Retrieval", "Reranking", "Chunking Strategies"],
  },
  {
    label: "Document AI",
    items: ["Multimodal AI", "OCR / PaddleOCR", "YOLOv10", "CV Layout Detection"],
  },
  {
    label: "Backend",
    items: ["FastAPI", "REST APIs", "AsyncIO", "PostgreSQL", "Supabase"],
  },
  {
    label: "Data & Pipelines",
    items: ["Airflow", "Apify", "NumPy", "Pandas", "BeautifulSoup"],
  },
  {
    label: "Cloud & Infra",
    items: ["Docker", "GCP", "Azure", "Modal", "Railway", "CI/CD", "Linux"],
  },
];

/* ------------------------------------------------------------------ */

export const EDUCATION = {
  school: "Indian Institute of Technology Madras",
  degree: "B.Tech in Chemical Engineering",
  period: "2023 – 2027",
  gpa: "7.64",
} as const;

export const ACHIEVEMENTS: string[] = [
  "98.61 percentile in JEE Mains among 1.2M+ candidates",
  "Top 450 in WBJEE",
  "AIR 71 (Junior Squad) and City Topper — Technothlon Prelims",
  "Ranked Top 20 nationally for solo ML pipeline contribution at Tecnod8",
  "Selected from 200+ startups by IITM NIRMAAN (R.E.A.C.H.)",
];

export const COURSEWORK: string[] = [
  "Deep Learning Specialization (Andrew Ng)",
  "Practical Deep Learning (fast.ai)",
  "LLM Fine-Tuning & Optimization",
  "Machine Learning in Production",
  "Generative AI for LLMs",
  "Full-Stack Development",
  "Mathematics for ML",
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
