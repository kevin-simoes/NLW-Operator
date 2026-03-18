# Create Roast Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a funcionalidade de criar roasts: usuário submete código, recebe análise de IA via Ollama, e é redirecionado para a página de resultado.

**Architecture:** Service Layer para Ollama + tRPC mutation + redirect para /roast/[id] + banco PostgreSQL

**Tech Stack:** Next.js 16, tRPC, Drizzle ORM, Ollama API, Codellama model

---

## Files Structure

- **Create:** `src/services/ai/roast-ai.ts`
- **Create:** `src/db/queries/create-roast.ts`
- **Modify:** `src/db/queries/index.ts`
- **Modify:** `src/trpc/routers/roast.ts`
- **Modify:** `src/app/home-editor.tsx`
- **Modify:** `src/app/roast/[id]/page.tsx`

---

### Task 1: Create AI Service (Ollama/Codellama)

**Files:**
- Create: `src/services/ai/roast-ai.ts`

- [ ] **Step 1: Create the service file**

```typescript
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "codellama";

export interface Issue {
  severity: "critical" | "warning" | "good";
  title: string;
  description: string;
}

export type VerdictType =
  | "needs_serious_help"
  | "rough_around_edges"
  | "decent_code"
  | "solid_work"
  | "exceptional";

export interface RoastAnalysis {
  score: number;
  verdict: VerdictType;
  roastQuote: string;
  issues: Issue[];
  suggestedFix?: string;
}

function buildPrompt(code: string, language: string, roastMode: boolean): string {
  const tone = roastMode
    ? "with MAXIMUM SARCASM. Be brutal, mean, and funny. Don't hold back."
    : "that is brutally honest but constructive.";

  return `<s>[INST] Analyze this ${language} code ${tone}

Return ONLY valid JSON with this exact structure:
{
  "score": <number 0-10>,
  "verdict": "needs_serious_help" | "rough_around_edges" | "decent_code" | "solid_work" | "exceptional",
  "roastQuote": "<short sarcastic/constructive quote about the code>",
  "issues": [
    {"severity": "critical" | "warning" | "good", "title": "<issue title>", "description": "<explanation>"}
  ],
  "suggestedFix": "<optional code improvement>"
}

Code to analyze:
${code}
[/INST]`;
}

export async function analyzeCode(
  code: string,
  language: string,
  roastMode: boolean
): Promise<RoastAnalysis> {
  const prompt = buildPrompt(code, language, roastMode);

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  const rawResponse = typeof data.response === "string" 
    ? data.response 
    : JSON.stringify(data.response);

  try {
    const cleaned = rawResponse
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    
    const parsed = JSON.parse(cleaned) as RoastAnalysis;
    
    return {
      score: Math.max(0, Math.min(10, Number(parsed.score) || 5)),
      verdict: parsed.verdict,
      roastQuote: parsed.roastQuote || "No comment.",
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      suggestedFix: parsed.suggestedFix,
    };
  } catch {
    console.error("Failed to parse Ollama response:", rawResponse);
    return {
      score: 5,
      verdict: "decent_code" as VerdictType,
      roastQuote: "The code... exists. That's something.",
      issues: [],
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/ai/roast-ai.ts
git commit -m "feat: add Ollama AI service for roast analysis"
```

---

### Task 2: Create Database Query

**Files:**
- Create: `src/db/queries/create-roast.ts`

- [ ] **Step 1: Create the query**

```typescript
import { db } from "@/db";
import { analysisItems, roasts } from "@/db/schema";
import type { RoastAnalysis, VerdictType } from "@/services/ai/roast-ai";

export async function createRoast(
  code: string,
  language: string,
  roastMode: boolean,
  analysis: RoastAnalysis
) {
  const [roast] = await db
    .insert(roasts)
    .values({
      code,
      language,
      lineCount: code.split("\n").length,
      roastMode,
      score: analysis.score,
      verdict: analysis.verdict as VerdictType,
      roastQuote: analysis.roastQuote,
      suggestedFix: analysis.suggestedFix,
    })
    .returning({ id: roasts.id });

  if (analysis.issues.length > 0) {
    await db.insert(analysisItems).values(
      analysis.issues.map((issue, index) => ({
        roastId: roast.id,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        order: index + 1,
      }))
    );
  }

  return roast;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/db/queries/create-roast.ts
git commit -m "feat: add createRoast database query"
```

---

### Task 3: Export Query from Index

**Files:**
- Modify: `src/db/queries/index.ts`

- [ ] **Step 1: Add export**

```typescript
export { getLeaderboard } from "./get-leaderboard";
export { getLeaderboardEntries } from "./get-leaderboard-entries";
export { getRoastById } from "./get-roast-by-id";
export { createRoast } from "./create-roast";
```

- [ ] **Step 2: Commit**

```bash
git add src/db/queries/index.ts
git commit -m "feat: export createRoast query"
```

---

### Task 4: Add tRPC Mutation

**Files:**
- Modify: `src/trpc/routers/roast.ts`

- [ ] **Step 1: Add imports and mutation**

Add to imports:
```typescript
import { z } from "zod";
import { analyzeCode } from "@/services/ai/roast-ai";
import { createRoast } from "@/db/queries";
```

Add new procedure to roastRouter:
```typescript
createRoast: baseProcedure
  .input(
    z.object({
      code: z.string().max(100000),
      language: z.string().max(50),
      roastMode: z.boolean(),
    })
  )
  .mutation(async ({ input }) => {
    const analysis = await analyzeCode(
      input.code,
      input.language,
      input.roastMode
    );

    const roast = await createRoast(
      input.code,
      input.language,
      input.roastMode,
      analysis
    );

    return { id: roast.id };
  }),
```

- [ ] **Step 2: Commit**

```bash
git add src/trpc/routers/roast.ts
git commit -m "feat: add createRoast tRPC mutation"
```

---

### Task 5: Update HomeEditor Client Component

**Files:**
- Modify: `src/app/home-editor.tsx`

- [ ] **Step 1: Update imports and state**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { CodeEditor } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

function HomeEditor() {
  const [code, setCode] = useState("");
  const [roastMode, setRoastMode] = useState(true);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const router = useRouter();
  const trpc = useTRPC();

  const handleCountChange = (_count: number, overLimit: boolean) => {
    setIsOverLimit(overLimit);
  };

  const createRoastMutation = useMutation(
    trpc.roast.createRoast.mutationOptions({
      onSuccess: (data) => {
        router.push(`/roast/${data.id}`);
      },
      onError: (error) => {
        console.error("Failed to create roast:", error);
        alert("Failed to analyze code. Please try again.");
      },
    })
  );

  const handleSubmit = () => {
    createRoastMutation.mutate({
      code,
      language: "javascript", // hardcoded: language auto-detection is out of scope (see spec)
      roastMode,
    });
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <CodeEditor
        value={code}
        onChange={setCode}
        onCountChange={handleCountChange}
        maxLength={100000}
        className="w-full max-w-3xl"
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between w-full max-w-3xl">
        <div className="flex items-center gap-4">
          <Toggle
            checked={roastMode}
            onCheckedChange={setRoastMode}
            label="roast mode"
          />
          <span className="font-mono text-xs text-text-tertiary">
            {"// maximum sarcasm enabled"}
          </span>
        </div>

        <Button
          variant="primary"
          size="lg"
          disabled={
            code.trim().length === 0 ||
            isOverLimit ||
            createRoastMutation.isPending
          }
          onClick={handleSubmit}
        >
          {createRoastMutation.isPending ? "$ analyzing..." : "$ roast_my_code"}
        </Button>
      </div>
    </div>
  );
}

export { HomeEditor };
```

- [ ] **Step 2: Commit**

```bash
git add src/app/home-editor.tsx
git commit -m "feat: wire up roast submission with tRPC mutation"
```

---

### Task 6: Update Roast Result Page

**Files:**
- Modify: `src/app/roast/[id]/page.tsx`

Current file structure (lines 1-93 shown):
```tsx
import { notFound } from "next/navigation"; // ADD THIS
// ... existing imports

// Remove this mock data (lines 19-69):
const mockRoast = {
  score: 3.5,
  verdict: "needs_serious_help",
  // ... entire mockRoast object
};

// In the page component (around lines 76-78):
const dbRoast = await getRoastById(id);
if (!dbRoast) {
  notFound(); // ADD THIS CHECK
}
const roast = dbRoast; // REMOVE: ?? mockRoast fallback
```

**Changes to apply:**

1. Add import at top:
```tsx
import { notFound } from "next/navigation";
```

2. After line 76 (`const { id } = await params;`):
```tsx
const dbRoast = await getRoastById(id);

if (!dbRoast) {
  notFound();
}
```

3. Change line 78 from:
```tsx
const roast = dbRoast ?? mockRoast;
```
to:
```tsx
const roast = dbRoast;
```

4. Remove the entire `mockRoast` constant (lines 19-69)

- [ ] **Step 2: Commit**

```bash
git add src/app/roast/[id]/page.tsx
git commit -m "feat: remove mock data fallback from roast result page"
```

---

### Task 7: Add Environment Variables

**Files:**
- Create: `.env.local.example`

- [ ] **Step 1: Create example file**

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=codellama
```

- [ ] **Step 2: Commit**

```bash
git add .env.local.example
git commit -m "docs: add Ollama environment variables example"
```

---

### Task 8: Run Lint and Typecheck

- [ ] **Step 1: Run lint**

Run: `npm run lint`

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit any fixes**

```bash
git add -u
git commit -m "fix: lint and typecheck"
```

---

### Task 9: Manual Testing

- [ ] **Step 1: Ensure Ollama is running**

Run: `ollama run codellama` (first time: `ollama pull codellama`)

- [ ] **Step 2: Ensure database is accessible**

Check your `.env.local` has `DATABASE_URL` set. Use `npm run db:studio` to verify connection.

- [ ] **Step 3: Seed database (optional)**

Run: `npx dotenv-cli -e .env.local -- npm run db:seed`

- [ ] **Step 4: Start dev server**

Run: `npm run dev`

- [ ] **Step 5: Test the flow**

1. Go to homepage (http://localhost:3000)
2. Enter some code in the editor
3. Toggle roast mode on/off
4. Click "roast_my_code"
5. Wait for analysis (Ollama response takes a few seconds)
6. Verify redirect to /roast/[id]
7. Verify all data is displayed correctly