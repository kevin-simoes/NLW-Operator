# Leaderboard Page Backend Integration

**Date:** 2026-03-18  
**Status:** Draft

## Overview

Implementar a página de leaderboard (`/leaderboard`) com dados reais do banco de dados, exibindo 20 resultados ordenados por score decrescente, com código collapsible.

## Requirements

- **Page:** `/leaderboard`
- **Results:** 20 entries, no pagination
- **Order:** Score descending (highest first)
- **Code display:** Collapsible, max 4 lines preview

## Architecture

### 1. Database Query

New file: `src/db/queries/get-leaderboard-entries.ts`

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

### 2. Export from index

File: `src/db/queries/index.ts`

```typescript
export { getLeaderboard } from "./get-leaderboard";
export { getRoastById } from "./get-roast-by-id";
export { getLeaderboardEntries } from "./get-leaderboard-entries";
```

### 3. tRPC Router

File: `src/trpc/routers/roast.ts`

Add new procedure:

```typescript
getLeaderboardEntries: baseProcedure.query(async () => {
  return getLeaderboardEntries();
}),
```

### 4. Page Component

File: `src/app/leaderboard/page.tsx`

Changes:
- Replace static `entries` array with data from `caller.roast.getLeaderboardEntries()`
- Wrap in Suspense with skeleton
- Use `CollapsibleCodeRow` component (existing)
- Calculate rank from array index

## Implementation Notes

- Use Server Component pattern with Suspense (per project conventions)
- Reuse existing `CollapsibleCodeRow` component from `src/components/collapsible-code-row.tsx`
- Use existing color function `scoreColor()` for score styling
- Calculate rank as index + 1 (not from database, since we're ordering differently)

## Files to Modify/Create

1. `src/db/queries/get-leaderboard-entries.ts` (new)
2. `src/db/queries/index.ts` (update - add export)
3. `src/trpc/routers/roast.ts` (update - add procedure)
4. `src/app/leaderboard/page.tsx` (update - integrate data)

## No Changes Required

- `CodeBlock` component (already used in page)
- `CollapsibleCodeRow` component (already exists)
- Schema (already has required fields)