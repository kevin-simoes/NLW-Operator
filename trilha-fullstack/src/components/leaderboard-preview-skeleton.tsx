export function LeaderboardPreviewSkeleton() {
  return (
    <div className="border border-border-primary w-full">
      <div className="flex items-center h-10 px-5 bg-bg-surface border-b border-border-primary">
        <div className="h-3 w-8 bg-bg-elevated animate-pulse rounded" />
        <div className="ml-8 h-3 w-12 bg-bg-elevated animate-pulse rounded" />
        <div className="flex-1 ml-4 h-3 w-48 bg-bg-elevated animate-pulse rounded" />
        <div className="h-3 w-16 bg-bg-elevated animate-pulse rounded" />
      </div>

      <div className="flex flex-col">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex items-center px-5 py-4 ${i < 3 ? "border-b border-border-primary" : ""}`}
          >
            <div className="h-3 w-8 bg-bg-elevated animate-pulse rounded" />
            <div className="ml-2 h-3 w-10 bg-bg-elevated animate-pulse rounded" />
            <div className="flex-1 ml-4 flex flex-col gap-1">
              <div className="h-3 w-3/4 bg-bg-elevated animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-bg-elevated animate-pulse rounded" />
            </div>
            <div className="h-3 w-16 bg-bg-elevated animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
