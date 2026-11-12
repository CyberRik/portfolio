import type { MetadataRoute } from "next";
import { ARCHIVE, FEATURED } from "@/content/work";
import { SITE_URL } from "@/lib/site";

/** every public page: the room, the brief, and each case study */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/brief`, priority: 0.9 },
    ...[...FEATURED, ...ARCHIVE].map((id) => ({
      url: `${SITE_URL}/brief/work/${id}`,
      priority: 0.7,
    })),
  ];
}
