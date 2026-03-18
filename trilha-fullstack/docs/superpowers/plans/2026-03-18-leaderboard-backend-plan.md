# Leaderboard Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a página de leaderboard com dados reais do banco, exibindo 20 resultados ordenados por score decrescente com collapsible.

**Architecture:** Criar nova query para buscar 20 entries, adicionar procedure no tRPC router, atualizar página para usar Server Components com Suspense.

**Tech Stack:** Next.js 16, tRPC, Drizzle ORM, @base-ui/react Collapsible

---

## Files Structure

- **Create:** `src/db/queries/get-leaderboard-entries.ts`
- **Modify:** `src/db/queries/index.ts:1-2`
- **Modify:** `src/trpc/routers/roast.ts:22-25`
- **Modify:** `src/app/leaderboard/page.tsx:1-162`

---

### Task 1: Create getLeaderboardEntries query

**Files:**
- Create: `src/db/queries/get-leaderboard-entries.ts`

- [ ] **Step 1: Write the query**

```typescript
import { desc, count } from "drizzle-orm";
import { db } from "@/db";
import { roasts } from "@/db/schema";

export async function getLeaderboardEntries() {
  const [entriesResult, countResult] = await Promise.all([
    db
      .select({
        id: roasts.id,
        score: roasts.score,
        language: roasts.language,
        code: roasts.code,
        lineCount: roasts.lineCount,
      })
      .from(roasts)
      .orderBy(desc(roasts.score))
      .limit(20),
    db.select({ total: count() }).from(roasts),
  ]);

  return {
    totalCount: countResult[0]?.total ?? 0,
    entries: entriesResult,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/db/queries/get-leaderboard-entries.ts
git commit -m "feat: add getLeaderboardEntries query for 20 entries"
```

---

### Task 2: Export query from index

**Files:**
- Modify: `src/db/queries/index.ts:1-3`

- [ ] **Step 1: Add export**

```typescript
export { getLeaderboard } from "./get-leaderboard";
export { getRoastById } from "./get-roast-by-id";
export { getLeaderboardEntries } from "./get-leaderboard-entries";
```

- [ ] **Step 2: Commit**

```bash
git add src/db/queries/index.ts
git commit -m "feat: export getLeaderboardEntries query"
```

---

### Task 3: Add tRPC procedure

**Files:**
- Modify: `src/trpc/routers/roast.ts:22-25`

- [ ] **Step 1: Add import and procedure**

```typescript
import { getLeaderboardEntries } from "@/db/queries";
```

Add after getLeaderboard procedure:

```typescript
getLeaderboardEntries: baseProcedure.query(async () => {
  return getLeaderboardEntries();
}),
```

- [ ] **Step 2: Commit**

```bash
git add src/trpc/routers/roast.ts
git commit -m "feat: add getLeaderboardEntries tRPC procedure"
```

---

### Task 4: Update leaderboard page

**Files:**
- Modify: `src/app/leaderboard/page.tsx:1-162`

- [ ] **Step 1: Replace page content**

```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { caller } from "@/trpc/server";
import { CollapsibleCodeRow } from "@/components/collapsible-code-row";
import { LeaderboardPageSkeleton } from "./leaderboard-skeleton";

export const metadata: Metadata = {
  title: "Shame Leaderboard — DevRoast",
  description:
    "The most roasted code on the internet. See the worst-scored submissions ranked by shame.",
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
              shame_leaderboard
            </h1>
          </div>

          <p className="font-mono text-sm text-text-secondary">
            {"// the most roasted code on the internet"}
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
                  lang={entry.language}
                  maxLines={4}
                />
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create skeleton component**

Create `src/app/leaderboard/leaderboard-skeleton.tsx`:

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/app/leaderboard/page.tsx src/app/leaderboard/leaderboard-skeleton.tsx
git commit -m "feat: integrate leaderboard with real data and collapsible"
```

---

### Task 5: Run lint and typecheck

**Files:**
- All modified files

- [ ] **Step 1: Run lint**

Run: `pnpm lint`

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`

- [ ] **Step 3: Commit any fixes**

```bash
git add -u
git commit -m "fix: lint and typecheck issues"
```

---

### Task 6: Verify implementation

- [ ] **Step 1: Test the page**

Run dev server and navigate to `/leaderboard` to verify:
- 20 entries displayed
- Score in descending order
- Collapsible works on entries with >4 lines
- Skeleton shows while loading