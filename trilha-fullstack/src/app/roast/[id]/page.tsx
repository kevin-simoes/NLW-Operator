import type { Metadata } from "next";
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

const mockRoast = {
  score: 3.5,
  verdict: "needs_serious_help",
  roastQuote:
    '"this code looks like it was written during a power outage... in 2005."',
  language: "javascript",
  lineCount: 7,
  code: `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`,
  items: [
    {
      severity: "critical" as const,
      title: "using var instead of const/let",
      description:
        "var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
    },
    {
      severity: "warning" as const,
      title: "imperative loop pattern",
      description:
        "for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.",
    },
    {
      severity: "good" as const,
      title: "clear naming conventions",
      description:
        "calculateTotal and items are descriptive, self-documenting names that communicate intent without comments.",
    },
    {
      severity: "good" as const,
      title: "single responsibility",
      description:
        "the function does one thing well — calculates a total. no side effects, no mixed concerns, no hidden complexity.",
    },
  ],
  suggestedFix: "return items.reduce((sum, item) => sum + item.price, 0);",
};
export default async function RoastResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dbRoast = await getRoastById(id);

  const roast = dbRoast ?? mockRoast;

  const issues = dbRoast
    ? dbRoast.items.map((item) => ({
        variant: item.severity,
        label: item.severity,
        title: item.title,
        description: item.description,
      }))
    : mockRoast.items.map((item) => ({
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
