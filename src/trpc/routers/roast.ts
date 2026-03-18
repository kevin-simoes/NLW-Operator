import { avg, count } from "drizzle-orm";
import { db } from "@/db";
import { roasts } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const roastRouter = createTRPCRouter({
  getStats: baseProcedure.query(async () => {
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
});
