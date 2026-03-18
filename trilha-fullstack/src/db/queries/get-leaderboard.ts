import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import { roasts } from "@/db/schema";

export async function getLeaderboard() {
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
      .limit(3),
    db.select({ total: count() }).from(roasts),
  ]);

  return {
    totalCount: countResult[0]?.total ?? 0,
    entries: entriesResult,
  };
}
