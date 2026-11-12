import { OG_SIZE, ogCard } from "./_og/card";

export const alt = "Ritankar Mondal — an interactive 3D workspace";
export const size = OG_SIZE;
export const contentType = "image/png";

/** The room's preview: the name over a render of the room itself. */
export default function Image() {
  return ogCard({
    eyebrow: "AI Engineer · IIT Madras",
    title: "Ritankar Mondal",
    subtitle: "An interactive 3D workspace — explore the room to see the work.",
    background: "room.jpg",
  });
}
