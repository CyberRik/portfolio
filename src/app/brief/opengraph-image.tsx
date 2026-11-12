import { OG_SIZE, ogCard } from "../_og/card";

export const alt =
  "Ritankar Mondal — AI Engineer. The brief: experience, work and results.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "AI Engineer · IIT Madras",
    title: "Ritankar Mondal",
    subtitle: "Builds models, and the systems that keep them running.",
    footer: "ritankar-mondal.vercel.app/brief",
  });
}
