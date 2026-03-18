import { count, desc } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { db } from "@/db";
import { roasts } from "@/db/schema";

export async function getLeaderboardEntries() {
  "use cache";
  cacheLife({
    stale: 3600,
    revalidate: 3600,
    expire: 3600,
  });

  const [entriesResult, countResult] = await Promise.all([
    db
      .select({
        id: roasts.id,
        score: roasts.score,
        language: roasts.language,
        code: roasts.code,
        lineCount: roasts.lineCount,
      })
      .from(roasts)
      .orderBy(desc(roasts.score))
      .limit(20),
    db.select({ total: count() }).from(roasts),
  ]);

  return {
    totalCount: countResult[0]?.total ?? 0,
    entries: entriesResult,
  };
}
