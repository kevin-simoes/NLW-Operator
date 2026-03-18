"use client";

import NumberFlow from "@number-flow/react";

interface StatsProps {
  totalRoasts: number;
  avgScore: number;
}

export function Stats({ totalRoasts, avgScore }: StatsProps) {
  return (
    <div className="flex items-center gap-6 justify-center pt-8">
      <span className="font-mono text-xs text-text-tertiary">
        <NumberFlow value={totalRoasts} /> codes roasted
      </span>
      <span className="font-mono text-xs text-text-tertiary">·</span>
      <span className="font-mono text-xs text-text-tertiary">
        avg score:{" "}
        <NumberFlow
          value={avgScore}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
        />
        /10
      </span>
    </div>
  );
}
