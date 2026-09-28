import { PROFILE } from "@/content/portfolio";

/**
 * Live LeetCode solved counts for the header.
 *
 * Fetched server-side because LeetCode's GraphQL endpoint rejects browser
 * CORS requests. The route is statically cached and regenerated at most
 * once an hour (ISR), so every visitor shares one upstream request per
 * hour and the count climbs on its own as problems get solved — no
 * redeploy.
 *
 * A failed fetch yields null; the header simply omits the number rather
 * than showing a stale or broken one.
 */
export const revalidate = 3600;

export interface ProfileStats {
  leetcode: { solved: number; easy: number; medium: number; hard: number } | null;
}

async function leetcode(): Promise<ProfileStats["leetcode"]> {
  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
      body: JSON.stringify({
        query: `query($u: String!) {
          matchedUser(username: $u) {
            submitStatsGlobal { acSubmissionNum { difficulty count } }
          }
        }`,
        variables: { u: PROFILE.leetcode },
      }),
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rows: { difficulty: string; count: number }[] | undefined =
      json?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;
    if (!rows) return null;
    const by = (d: string) => rows.find((r) => r.difficulty === d)?.count ?? 0;
    return { solved: by("All"), easy: by("Easy"), medium: by("Medium"), hard: by("Hard") };
  } catch {
    return null;
  }
}

export async function GET() {
  const body: ProfileStats = { leetcode: await leetcode() };
  return Response.json(body);
}
