import { eq } from "drizzle-orm";
import { db } from "@/db";
import { analysisItems, roasts } from "@/db/schema";

export async function getRoastById(id: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return null;
  }

  const roast = await db
    .select({
      id: roasts.id,
      code: roasts.code,
      language: roasts.language,
      lineCount: roasts.lineCount,
      roastMode: roasts.roastMode,
      score: roasts.score,
      verdict: roasts.verdict,
      roastQuote: roasts.roastQuote,
      suggestedFix: roasts.suggestedFix,
      createdAt: roasts.createdAt,
    })
    .from(roasts)
    .where(eq(roasts.id, id))
    .limit(1);

  if (roast.length === 0) {
    return null;
  }

  const items = await db
    .select({
      id: analysisItems.id,
      severity: analysisItems.severity,
      title: analysisItems.title,
      description: analysisItems.description,
      order: analysisItems.order,
    })
    .from(analysisItems)
    .where(eq(analysisItems.roastId, id))
    .orderBy(analysisItems.order);

  return {
    ...roast[0],
    items,
  };
}
