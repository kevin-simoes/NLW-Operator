import Link from "next/link";
import { Suspense } from "react";
import type { BundledLanguage } from "shiki";
import { StatsWrapper } from "@/components/stats-wrapper";
import { caller } from "@/trpc/server";
import { CollapsibleCodeRow } from "./collapsible-code-row";
import { LeaderboardPreviewSkeleton } from "./leaderboard-preview-skeleton";

function scoreColor(score: number): string {
  if (score <= 3) return "text-accent-red";
  if (score <= 6) return "text-accent-amber";
  return "text-accent-green";
}

export function LeaderboardPreview() {
  return (
    <Suspense fallback={<LeaderboardPreviewSkeleton />}>
      <LeaderboardPreviewInner />
    </Suspense>
  );
}

async function LeaderboardPreviewInner() {
  const { totalCount, entries } = await caller.roast.getLeaderboard();

  return (
    <section className="flex flex-col gap-6 w-full max-w-5xl px-10 pb-15">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-accent-green">
            {"//"}
          </span>
          <span className="font-mono text-sm font-bold text-text-primary">
            shame_leaderboard
          </span>
        </div>

        <Link
          href="/leaderboard"
          className="font-mono text-xs text-text-secondary border border-border-primary px-3 py-1.5 hover:bg-bg-elevated transition-colors"
        >
          $ view_all {">>"}
        </Link>
      </div>

      <p className="font-mono text-[13px] text-text-tertiary -mt-2">
        {"// the worst code on the internet, ranked by shame"}
      </p>

      <div className="flex flex-col gap-3 w-full">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="flex flex-col border border-border-primary bg-bg-surface overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-bg-surface border-b border-border-primary">
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-sm font-bold ${index === 0 ? "text-accent-amber" : index === 1 ? "text-text-secondary" : "text-text-tertiary"}`}
                >
                  #{index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs text-text-tertiary">
                    score
                  </span>
                  <span
                    className={`font-mono text-lg font-bold ${scoreColor(Number(entry.score))}`}
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
                  {entry.lineCount} lines
                </span>
              </div>
            </div>

            <CollapsibleCodeRow
              code={entry.code}
              lang={entry.language as BundledLanguage}
              maxLines={4}
            />
          </div>
        ))}
      </div>

      <StatsWrapper />

      <p className="font-mono text-xs text-text-tertiary text-center">
        showing top 3 of {totalCount.toLocaleString()} ·{" "}
        <Link
          href="/leaderboard"
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          view full leaderboard {">>"}
        </Link>
      </p>
    </section>
  );
}
