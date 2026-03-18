# tRPC Integration Specification

## Overview

tRPC será utilizado como camada de API/backend do projeto DevRoast, integrado com Next.js App Router (Server Components) e TanStack React Query.

## Stack

- **tRPC** v11.x
- **TanStack React Query** v5
- **Zod** (validação de input)
- **Next.js** App Router

## Installation

```bash
pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only
```

## Estrutura de Arquivos

```
src/
  trpc/
    init.ts           # tRPC initialization (context, router helpers)
    query-client.ts   # QueryClient factory
    client.tsx        # Provider para Client Components
    server.tsx        # Server Components helpers + caller
    routers/
      _app.ts         # AppRouter principal
      roast.ts        # Router de roasts
```

## Implementation Steps

### 1. tRPC Initialization (`src/trpc/init.ts`)

```typescript
import { initTRPC } from '@trpc/server';
import { cache } from 'react';

export const createTRPCContext = cache(async () => {
  return {
    // Context vazio por agora - pode adicionar auth/db depois
  };
});

const t = initTRPC.create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
```

### 2. Query Client Factory (`src/trpc/query-client.ts`)

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

### 3. tRPC Router (`src/trpc/routers/_app.ts`)

```typescript
import { baseProcedure, createTRPCRouter } from '../init';
import { roastRouter } from './roast';

export const appRouter = createTRPCRouter({
  roast: roastRouter,
});

export type AppRouter = typeof appRouter;
```

### 4. Roast Router (`src/trpc/routers/roast.ts`)

```typescript
import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { getRoastById } from '@/db/queries';

export const roastRouter = createTRPCRouter({
  getById: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const roast = await getRoastById(input.id);
      if (!roast) {
        throw new Error('Roast not found');
      }
      return roast;
    }),
});
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

### 6. Client Provider (`src/trpc/client.tsx`)

```typescript
'use client';

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/_app';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function getUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${getUrl()}/api/trpc`,
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

### 7. Server Components Helper (`src/trpc/server.tsx`)

```typescript
import 'server-only';

import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';
import type { AppRouter } from './routers/_app';

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export const caller = appRouter.createCaller(createTRPCContext());
```

### 8. Wrap Layout with Provider

No `src/app/layout.tsx`:

```typescript
import { TRPCReactProvider } from '@/trpc/client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
```

## Usage

### Server Component (com prefetch)

```typescript
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient, trpc } from '@/trpc/server';

export default async function RoastPage({ params }: { params: { id: string } }) {
  const queryClient = getQueryClient();
  
  await queryClient.prefetchQuery(
    trpc.roast.getById.queryOptions({ id: params.id })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoastContent id={params.id} />
    </HydrationBoundary>
  );
}
```

### Client Component (useQuery)

```typescript
'use client';

import { useTRPC } from '@/trpc/client';

export function RoastContent({ id }: { id: string }) {
  const trpc = useTRPC();
  const { data: roast, isLoading } = trpc.roast.getById.useQuery({ id });

  if (isLoading) return <div>Loading...</div>;
  
  return <div>{roast.score}</div>;
}
```

### Server Component (直接调用)

```typescript
import { caller } from '@/trpc/server';

export default async function RoastPage({ params }: { params: { id: string } }) {
  const roast = await caller.roast.getById({ id: params.id });
  
  return <div>{roast.score}</div>;
}
```

## Procedimentos Iniciais

### Roast Router

| Procedure | Type | Input | Description |
|-----------|------|-------|-------------|
| `roast.getById` | query | `{ id: string }` | Busca roast por ID |
| `roast.list` | query | `{ limit?: number, offset?: number }` | Lista roasts (futuro) |

## Referências

- https://trpc.io/docs/client/tanstack-react-query/server-components
- https://trpc.io/docs/client/tanstack-react-query/setup
