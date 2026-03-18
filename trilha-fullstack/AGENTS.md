# DevRoast — Project Guidelines

## Stack

- **Framework:** Next.js 16 (App Router, React Compiler, Turbopack)
- **Styling:** Tailwind CSS v4 with `@theme` variables, `tailwind-variants` for component variants
- **Linting:** Biome 2.4 (formatter + linter, `tailwindDirectives: true`)
- **Package manager:** pnpm
- **Language:** TypeScript (strict)
- **API Layer:** tRPC v11 with TanStack React Query v5
- **Animations:** @number-flow/react for animated numbers

## Conventions

- **Language:** Portuguese for communication, English for code
- **Exports:** Always named exports. Never `export default` (except Next.js pages).
- **Components:** Extend native HTML props via `ComponentProps<"element">`. Use `tv()` for variants. Use composition pattern (sub-components) for complex components with 2+ content areas.
- **Class merging:** Use `tv({ className })` for components with variants. Use `twMerge()` for components without variants. Never string interpolation.
- **Colors:** Defined in `@theme` block (`--color-*`), used as canonical Tailwind classes (`bg-accent-green`, not `bg-(--color-accent-green)`). Exception: SVG attributes use `var(--color-*)`.
- **Fonts:** `font-sans` (system) and `font-mono` (JetBrains Mono) only. No custom font classes.
- **Buttons:** `enabled:hover:` and `enabled:active:` prefixes to prevent hover styles when disabled.

## Project Structure

```
src/
  app/              # Next.js App Router pages and layouts
  components/       # Feature-level components (navbar, code-editor, etc.)
    ui/             # Reusable UI primitives (see ui/AGENTS.md for patterns)
  trpc/             # tRPC setup and routers (see trpc/AGENTS.md)
  db/               # Database schema and queries
```

## Data Fetching Patterns

### Server Components with Suspense (Preferred)

For data fetching, prefer Server Components with Suspense and skeleton loading:

```tsx
// 1. Create a wrapper with Suspense
export function ComponentWrapper() {
  return (
    <Suspense fallback={<ComponentSkeleton />}>
      <ComponentInner />
    </Suspense>
  );
}

// 2. Create async Server Component that fetches data
async function ComponentInner() {
  const data = await caller.someProcedure();
  return <Component data={data} />;
}

// 3. Create skeleton component
export function ComponentSkeleton() {
  return <div className="h-4 w-24 bg-bg-elevated animate-pulse rounded" />;
}
```

### Number Animations

Use `@number-flow/react` for animated number transitions:

```tsx
import NumberFlow from '@number-flow/react';

<NumberFlow value={count} />
<NumberFlow value={score} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
```

### Parallel Database Queries

Use `Promise.all` to execute independent queries in parallel:

```typescript
// ❌ Sequential (slow)
const entries = await db.select(...).from(roasts);
const count = await db.select({ total: count() }).from(roasts);

// ✅ Parallel (fast)
const [entries, countResult] = await Promise.all([
  db.select(...).from(roasts),
  db.select({ total: count() }).from(roasts),
]);
```

## Key Decisions

- `CodeBlock` is an async React Server Component using shiki with vesper theme
- `Toggle` uses `@base-ui/react` Switch primitive for accessibility
- `ScoreRing` has a single fixed size (180px)
- Biome config has `noUnknownAtRules` ignore list for Tailwind directives (`@theme`, `@apply`, `@utility`)
- Use tRPC for all API operations (no direct API routes except tRPC handler)
- tRPC context provider (`TRPCReactProvider`) is mounted in root layout

## Git Workflow

### Commit Structure

Group commits by feature area:

```
chore: add project config files
feat: add database schema and queries
feat: add UI components
feat: add app pages
feat: add tRPC integration
docs: add specs
```

### Running Scripts with Environment Variables

For scripts that need `.env.local`:

```bash
npx dotenv-cli -e .env.local -- <command>
```

Example: `npx dotenv-cli -e .env.local -- npm run db:seed`
