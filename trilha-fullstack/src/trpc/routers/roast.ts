import { avg, count } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  createRoast,
  getLeaderboard,
  getLeaderboardEntries,
} from "@/db/queries";
import { roasts } from "@/db/schema";
import { analyzeCode } from "@/services/ai/roast-ai";
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

  createRoast: baseProcedure
    .input(
      z.object({
        code: z.string().max(100000),
        language: z.string().max(50),
        roastMode: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const analysis = await analyzeCode(
        input.code,
        input.language,
        input.roastMode,
      );

      const roast = await createRoast(
        input.code,
        input.language,
        input.roastMode,
        analysis,
      );

      return { id: roast.id };
    }),
});
