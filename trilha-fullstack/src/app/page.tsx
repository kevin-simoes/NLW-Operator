import { LeaderboardPreview } from "@/components/leaderboard-preview";
import { StatsWrapper } from "@/components/stats-wrapper";
import { HomeEditor } from "./home-editor";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center">
      <section className="flex flex-col items-center gap-3 pt-20 px-10">
        <h1 className="flex items-center gap-3 font-mono text-4xl font-bold">
          <span className="text-accent-green">$</span>
          <span className="text-text-primary">
            paste your code. get roasted.
          </span>
        </h1>
        <p className="font-mono text-sm text-text-secondary">
          {
            "// drop your code below and we'll rate it — brutally honest or full roast mode"
          }
        </p>
      </section>

      <section className="w-full max-w-5xl px-10 pt-8">
        <HomeEditor />
      </section>

      <StatsWrapper />

      <div className="h-15" />

      <LeaderboardPreview />
    </main>
  );
}
