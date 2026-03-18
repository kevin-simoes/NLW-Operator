# Database Guidelines

## Query Pattern

### Use `Promise.all` for Parallel Queries

When executing multiple independent queries, use `Promise.all` to run them in parallel:

```typescript
// ❌ Sequential (slow)
const entries = await db.select(...).from(roasts);
const countResult = await db.select({ total: count() }).from(roasts);

// ✅ Parallel (fast)
const [entries, countResult] = await Promise.all([
  db.select(...).from(roasts),
  db.select({ total: count() }).from(roasts),
]);
```

### File Structure

```
src/db/
├── index.ts           # Drizzle client export
├── schema.ts          # Database tables and enums
├── seed.ts            # Seed script (requires dotenv/config)
└── queries/
    ├── index.ts       # Export all queries
    ├── get-roast-by-id.ts
    └── get-leaderboard.ts
```

### Query Files

Each query is a standalone async function in `src/db/queries/`:

```typescript
// src/db/queries/get-leaderboard.ts
import { count, asc } from "drizzle-orm";
import { db } from "@/db";
import { roasts } from "@/db/schema";

export async function getLeaderboard() {
  const [entriesResult, countResult] = await Promise.all([
    db
      .select({ id: roasts.id, score: roasts.score, ... })
      .from(roasts)
      .orderBy(asc(roasts.score))
      .limit(3),
    db.select({ total: count() }).from(roasts),
  ]);

  return {
    totalCount: countResult[0]?.total ?? 0,
    entries: entriesResult,
  };
}
```

### Export Queries

Always export queries from `src/db/queries/index.ts`:

```typescript
export { getRoastById } from "./get-roast-by-id";
export { getLeaderboard } from "./get-leaderboard";
```

## Running Database Scripts

```bash
npx dotenv-cli -e .env.local -- <command>
```

Examples:
```bash
npx dotenv-cli -e .env.local -- npm run db:seed
npx dotenv-cli -e .env.local -- npm run db:push
npx dotenv-cli -e .env.local -- npm run db:studio
```
