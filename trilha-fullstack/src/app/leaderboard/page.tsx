import type { Metadata } from "next";
import { Suspense } from "react";
import type { BundledLanguage } from "shiki";
import { CollapsibleCodeRow } from "@/components/collapsible-code-row";
import { caller } from "@/trpc/server";
import { LeaderboardPageSkeleton } from "./leaderboard-skeleton";

export const metadata: Metadata = {
  title: "Leaderboard — DevRoast",
  description:
    "The best code on the internet. See the top-scored submissions ranked by excellence.",
};

function scoreColor(score: number): string {
  if (score <= 3) return "text-accent-red";
  if (score <= 6) return "text-accent-amber";
  return "text-accent-green";
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardPageSkeleton />}>
      <LeaderboardPageInner />
    </Suspense>
  );
}

async function LeaderboardPageInner() {
  const { totalCount, entries } = await caller.roast.getLeaderboardEntries();

  return (
    <main className="flex flex-col w-full">
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto px-10 md:px-20 py-10">
        {/* Hero Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[32px] font-bold text-accent-green">
              {">"}
            </span>
            <h1 className="font-mono text-[28px] font-bold text-text-primary">
              leaderboard
            </h1>
          </div>

          <p className="font-mono text-sm text-text-secondary">
            {"// the best code on the internet, ranked by excellence"}
          </p>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-tertiary">
              {totalCount.toLocaleString()} submissions
            </span>
            <span className="font-mono text-xs text-text-tertiary">{"·"}</span>
            <span className="font-mono text-xs text-text-tertiary">
              showing top 20
            </span>
          </div>
        </section>

        {/* Leaderboard Entries */}
        <section className="flex flex-col gap-5">
          {entries.map((entry, index) => {
            const lineCount = entry.lineCount ?? entry.code.split("\n").length;
            const rank = index + 1;

            return (
              <article
                key={entry.id}
                className="flex flex-col border border-border-primary overflow-hidden"
              >
                {/* Meta Row */}
                <div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[13px] text-text-tertiary">
                        #
                      </span>
                      <span className="font-mono text-[13px] font-bold text-accent-amber">
                        {rank}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-text-tertiary">
                        score:
                      </span>
                      <span
                        className={`font-mono text-[13px] font-bold ${scoreColor(Number(entry.score))}`}
                      >
                        {Number(entry.score).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-text-secondary">
                      {entry.language}
                    </span>
                    <span className="font-mono text-xs text-text-tertiary">
                      {lineCount} lines
                    </span>
                  </div>
                </div>

                {/* Code Preview */}
                <CollapsibleCodeRow
                  code={entry.code}
                  lang={entry.language as BundledLanguage}
                  maxLines={10}
                />
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
