"use client";

import NumberFlow from "@number-flow/react";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

type ScoreRingProps = ComponentProps<"div"> & {
  score: number;
  total?: number;
};

function scoreGradientId(score: number) {
  return `score-gradient-${score.toString().replace(".", "-")}`;
}

const SIZE = 180;

function ScoreRing({ score, total = 10, className, ...props }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const strokeWidth = 4;
  const radius = (SIZE - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(displayScore / total, 1);
  const filled = circumference * ratio;
  const gap = circumference - filled;
  const gradientId = scoreGradientId(score);

  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(score, increment * step);
      setDisplayScore(current);
      if (step >= steps) {
        setDisplayScore(score);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <div
      className={twMerge(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: SIZE, height: SIZE }}
      {...props}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 -rotate-90"
        role="img"
        aria-label={`Score: ${score} out of ${total}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-accent-green)" />
            <stop offset="100%" stopColor="var(--color-accent-amber)" />
          </linearGradient>
        </defs>

        {/* Background ring */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-primary)"
          strokeWidth={strokeWidth}
        />

        {/* Score arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${gap}`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center score */}
      <div className="flex items-end gap-0.5">
        <NumberFlow
          value={displayScore}
          className="font-mono text-5xl font-bold text-text-primary leading-none tabular-nums"
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
        />
        <span className="font-mono text-base text-text-tertiary leading-none mb-1">
          /{total}
        </span>
      </div>
    </div>
  );
}

export { ScoreRing, type ScoreRingProps };
