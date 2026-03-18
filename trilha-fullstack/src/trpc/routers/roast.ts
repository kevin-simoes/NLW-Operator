import { avg, count } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { db } from "@/db";
import { getLeaderboard, getLeaderboardEntries } from "@/db/queries";
import { roasts } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const roastRouter = createTRPCRouter({
  getStats: baseProcedure.query(async () => {
    "use cache";
    cacheLife({
      stale: 3600,
      revalidate: 3600,
      expire: 3600,
    });

    const [result] = await db
      .select({
        count: count(),
        avgScore: avg(roasts.score),
      })
      .from(roasts);

    return {
      totalRoasts: result?.count ?? 0,
      avgScore: result?.avgScore ?? 0,
    };
  }),

  getLeaderboard: baseProcedure.query(async () => {
    return getLeaderboard();
  }),

  getLeaderboardEntries: baseProcedure.query(async () => {
    return getLeaderboardEntries();
  }),
});
