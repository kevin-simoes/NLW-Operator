import { db } from "@/db";
import { analysisItems, roasts } from "@/db/schema";
import type { RoastAnalysis, VerdictType } from "@/services/ai/roast-ai";

export async function createRoast(
  code: string,
  language: string,
  roastMode: boolean,
  analysis: RoastAnalysis,
) {
  return db.transaction(async (tx) => {
    const [roast] = await tx
      .insert(roasts)
      .values({
        code,
        language,
        lineCount: code.split("\n").length,
        roastMode,
        score: analysis.score,
        verdict: analysis.verdict as VerdictType,
        roastQuote: analysis.roastQuote,
        suggestedFix: analysis.suggestedFix,
      })
      .returning({ id: roasts.id });

    if (analysis.issues.length > 0) {
      await tx.insert(analysisItems).values(
        analysis.issues.map((issue, index) => ({
          roastId: roast.id,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          order: index + 1,
        })),
      );
    }

    return roast;
  });
}
