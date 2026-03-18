"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";

interface StatsProps {
  totalRoasts: number;
  avgScore: number;
}

export function Stats({ totalRoasts, avgScore }: StatsProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(true);
  }, []);

  return (
    <div className="flex items-center gap-6 justify-center pt-8">
      <span className="font-mono text-xs text-text-tertiary">
        <NumberFlow value={animated ? totalRoasts : 0} /> codes roasted
      </span>
      <span className="font-mono text-xs text-text-tertiary">·</span>
      <span className="font-mono text-xs text-text-tertiary">
        avg score:{" "}
        <NumberFlow
          value={animated ? avgScore : 0}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
        />
        /10
      </span>
    </div>
  );
}
