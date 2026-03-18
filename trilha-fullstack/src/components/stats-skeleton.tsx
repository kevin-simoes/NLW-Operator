export function StatsSkeleton() {
  return (
    <div className="flex items-center gap-6 justify-center pt-8">
      <div className="h-4 w-24 bg-bg-elevated animate-pulse rounded" />
      <span className="font-mono text-xs text-text-tertiary">·</span>
      <div className="h-4 w-20 bg-bg-elevated animate-pulse rounded" />
    </div>
  );
}
