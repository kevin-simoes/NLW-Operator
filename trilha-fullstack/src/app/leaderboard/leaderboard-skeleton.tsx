export function LeaderboardPageSkeleton() {
  return (
    <main className="flex flex-col w-full">
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto px-10 md:px-20 py-10">
        {/* Hero Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-bg-elevated animate-pulse rounded" />
            <div className="h-7 w-48 bg-bg-elevated animate-pulse rounded" />
          </div>
          <div className="h-4 w-64 bg-bg-elevated animate-pulse rounded" />
          <div className="h-3 w-40 bg-bg-elevated animate-pulse rounded" />
        </section>

        {/* Entries Skeleton */}
        <section className="flex flex-col gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col border border-border-primary overflow-hidden"
            >
              <div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-8 bg-bg-elevated animate-pulse rounded" />
                  <div className="h-4 w-12 bg-bg-elevated animate-pulse rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-16 bg-bg-elevated animate-pulse rounded" />
                  <div className="h-3 w-10 bg-bg-elevated animate-pulse rounded" />
                </div>
              </div>
              <div className="h-32 bg-bg-input animate-pulse" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
