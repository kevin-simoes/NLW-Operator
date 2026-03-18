import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { BundledLanguage } from "shiki";
import {
  AnalysisCardDescription,
  AnalysisCardRoot,
  AnalysisCardTitle,
} from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import { ScoreRing } from "@/components/ui/score-ring";
import { getRoastById } from "@/db/queries";

export const metadata: Metadata = {
  title: "Roast Result — DevRoast",
  description: "See how your code scored on DevRoast — brutally honest.",
};

export default async function RoastResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dbRoast = await getRoastById(id);

  if (!dbRoast) {
    notFound();
  }

  const roast = dbRoast;

  const issues = roast.items.map((item) => ({
    variant: item.severity,
    label: item.severity,
    title: item.title,
    description: item.description,
  }));

  return (
    <main className="flex flex-col w-full">
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto px-10 md:px-20 py-10">
        <section className="flex items-center gap-12">
          <ScoreRing score={roast.score} />

          <div className="flex flex-col gap-4 flex-1">
            <Badge
              variant={
                roast.score <= 3
                  ? "critical"
                  : roast.score <= 6
                    ? "warning"
                    : "good"
              }
            >
              verdict: {roast.verdict}
            </Badge>

            <p className="font-mono text-xl leading-relaxed text-text-primary">
              {roast.roastQuote}
            </p>

            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-text-tertiary">
                lang: {roast.language}
              </span>
              <span className="font-mono text-xs text-text-tertiary">
                {"·"}
              </span>
              <span className="font-mono text-xs text-text-tertiary">
                {roast.lineCount} lines
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="font-mono text-xs text-text-primary border border-border-primary px-4 py-2 enabled:hover:bg-bg-elevated transition-colors"
              >
                $ share_roast
              </button>
            </div>
          </div>
        </section>

        <hr className="border-border-primary" />

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {"//"}
            </span>
            <h2 className="font-mono text-sm font-bold text-text-primary">
              your_submission
            </h2>
          </div>

          <CodeBlock
            code={roast.code}
            lang={roast.language as BundledLanguage}
          />
        </section>

        <hr className="border-border-primary" />

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {"//"}
            </span>
            <h2 className="font-mono text-sm font-bold text-text-primary">
              detailed_analysis
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {issues.map((issue) => (
              <AnalysisCardRoot key={issue.title}>
                <Badge variant={issue.variant}>{issue.label}</Badge>
                <AnalysisCardTitle>{issue.title}</AnalysisCardTitle>
                <AnalysisCardDescription>
                  {issue.description}
                </AnalysisCardDescription>
              </AnalysisCardRoot>
            ))}
          </div>
        </section>

        <hr className="border-border-primary" />

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {"//"}
            </span>
            <h2 className="font-mono text-sm font-bold text-text-primary">
              suggested_fix
            </h2>
          </div>

          <div className="border border-border-primary bg-bg-input overflow-hidden">
            <div className="flex items-center gap-2 h-10 px-4 border-b border-border-primary">
              <span className="font-mono text-xs font-medium text-text-secondary">
                improved_code.ts
              </span>
            </div>

            <div className="flex flex-col py-1">
              {roast.suggestedFix ? (
                <DiffLine type="added">{roast.suggestedFix}</DiffLine>
              ) : (
                <div className="font-mono text-xs text-text-tertiary px-4 py-2">
                  {"// no fix suggested"}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
