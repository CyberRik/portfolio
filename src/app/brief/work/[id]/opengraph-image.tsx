import {
  ARCHIVE,
  FEATURED,
  PROJECT_DOCS,
  type ProjectDoc,
} from "@/content/work";
import { OG_SIZE, ogCard } from "../../../_og/card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A project case study by Ritankar Mondal";

export function generateStaticParams() {
  return [...FEATURED, ...ARCHIVE].map((id) => ({ id }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const p = (PROJECT_DOCS as Record<string, ProjectDoc>)[(await params).id];
  return ogCard({
    eyebrow: `Case study · ${p.period}`,
    title: p.shortTitle ?? p.title,
    subtitle: p.tagline,
    footer: p.context,
  });
}
