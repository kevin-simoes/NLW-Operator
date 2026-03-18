import { Suspense } from "react";
import { caller } from "@/trpc/server";
import { Stats } from "./stats";
import { StatsSkeleton } from "./stats-skeleton";

export function StatsWrapper() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsInner />
    </Suspense>
  );
}

async function StatsInner() {
  const data = await caller.roast.getStats();

  return (
    <Stats totalRoasts={data.totalRoasts} avgScore={Number(data.avgScore)} />
  );
}
