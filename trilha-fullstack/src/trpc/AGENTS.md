# tRPC Integration Guidelines

## Overview

tRPC is used as the API/backend layer, integrated with Next.js App Router (Server Components) and TanStack React Query v5.

## Installation

```bash
pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only
```

## File Structure

```
src/trpc/
├── init.ts           # tRPC initialization (context, router helpers)
├── query-client.ts   # QueryClient factory
├── client.tsx       # Provider for Client Components
├── server.tsx       # Server Components helpers + caller
└── routers/
    ├── _app.ts      # AppRouter (root router)
    └── roast.ts     # Roast router procedures
```

## Implementation Pattern

### 1. Initialize tRPC (`init.ts`)

```typescript
import { initTRPC } from '@trpc/server';
import { cache } from 'react';

export const createTRPCContext = cache(async () => {
  return {};
});

const t = initTRPC.create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
```

### 2. Query Client Factory (`query-client.ts`)

```typescript
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}
```

### 3. Create Router (`routers/*.ts`)

```typescript
import { baseProcedure, createTRPCRouter } from '../init';
import { z } from 'zod';

export const roastRouter = createTRPCRouter({
  getStats: baseProcedure.query(async () => {
    // DB query here
    return { totalRoasts: 0, avgScore: 0 };
  }),
});
```

### 4. App Router (`routers/_app.ts`)

```typescript
import { createTRPCRouter } from '../init';
import { roastRouter } from './roast';

export const appRouter = createTRPCRouter({
  roast: roastRouter,
});

export type AppRouter = typeof appRouter;
```

### 5. API Route (`src/app/api/trpc/[trpc]/route.ts`)

```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/_app';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

### 6. Client Provider (`client.tsx`)

Already configured in root layout via `TRPCReactProvider`.

### 7. Server Helper (`server.tsx`)

```typescript
import 'server-only';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';

export const getQueryClient = cache(makeQueryClient);
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});
export const caller = appRouter.createCaller(createTRPCContext());
```

## Usage Patterns

### Server Component (Direct Call)

Best for initial page load - no client-side fetching needed:

```tsx
// components/stats-wrapper.tsx
import { Suspense } from 'react';
import { caller } from '@/trpc/server';
import { Stats } from './stats';
import { StatsSkeleton } from './stats-skeleton';

export function StatsWrapper() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsInner />
    </Suspense>
  );
}

async function StatsInner() {
  const data = await caller.roast.getStats();
  return <Stats totalRoasts={data.totalRoasts} avgScore={data.avgScore} />;
}
```

### Server Component (Prefetch for Client Hydration)

When you need to share data with client components:

```tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient, trpc } from '@/trpc/server';

export default async function Page() {
  const queryClient = getQueryClient();
  
  await queryClient.prefetchQuery(
    trpc.roast.getStats.queryOptions()
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientComponent />
    </HydrationBoundary>
  );
}
```

### Client Component (useQuery)

For interactive components that need real-time updates:

```tsx
'use client';

import { useTRPC } from '@/trpc/client';

export function InteractiveComponent() {
  const trpc = useTRPC();
  const { data } = trpc.roast.getStats.useQuery();
  
  if (!data) return <div>Loading...</div>;
  return <div>{data.totalRoasts}</div>;
}
```

## Number Animations

Use `@number-flow/react` for animated number transitions (zero to value):

```bash
pnpm add @number-flow/react
```

```tsx
'use client';

import NumberFlow from '@number-flow/react';

export function Stats({ totalRoasts, avgScore }: Props) {
  return (
    <div>
      <span>
        <NumberFlow value={totalRoasts} /> codes roasted
      </span>
      <span>
        avg: <NumberFlow value={avgScore} format={{ minimumFractionDigits: 1 }} />/10
      </span>
    </div>
  );
}
```

## Skeleton Loading

Create skeleton components for Suspense fallback:

```tsx
// components/stats-skeleton.tsx
export function StatsSkeleton() {
  return (
    <div className="flex items-center gap-6">
      <div className="h-4 w-24 bg-bg-elevated animate-pulse rounded" />
      <div className="h-4 w-20 bg-bg-elevated animate-pulse rounded" />
    </div>
  );
}
```

## Running Scripts with Environment Variables

```bash
npx dotenv-cli -e .env.local -- <command>
```

Example: `npx dotenv-cli -e .env.local -- npm run db:seed`

## References

- [tRPC Server Components](https://trpc.io/docs/client/tanstack-react-query/server-components)
- [TanStack React Query Setup](https://trpc.io/docs/client/tanstack-react-query/setup)
- [number-flow](https://number-flow.barvian.me/)
