# Create Roast Feature Design

**Date:** 2026-03-18  
**Status:** Draft

## Overview

Implementar a funcionalidade de criar roasts: usuário submete código, recebe análise de IA via Ollama (Codellama), e é redirecionado para a página de resultado.

## Requirements

- **Input:** Código + linguagem + roast mode (boolean)
- **AI:** Ollama com modelo Codellama
- **Output:** Score, verdict, roast quote, issues (severity + title + description), suggested fix
- **Flow:** Submit → Analyze → Redirect to `/roast/[id]`
- **Limit:** 500 linhas máximo

## Architecture

### 1. AI Service Layer

**File:** `src/services/ai/roast-ai.ts`

Responsável por:
- Chamar Ollama API
- Construir prompt baseado no roast mode
- Parsear resposta JSON
- Retornar estrutura tipada

```typescript
interface RoastAnalysis {
  score: number;           // 0-10
  verdict: VerdictType;    // needs_serious_help | rough_around_edges | decent_code | solid_work | exceptional
  roastQuote: string;       // Sarcastic comment
  issues: Issue[];
  suggestedFix?: string;
}

interface Issue {
  severity: "critical" | "warning" | "good";
  title: string;
  description: string;
}

export async function analyzeCode(
  code: string,
  language: string,
  roastMode: boolean
): Promise<RoastAnalysis>
```

### 2. Database Query

**File:** `src/db/queries/create-roast.ts`

Insere roast e analysis items no banco:

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

### 3. tRPC Mutation

**File:** `src/trpc/routers/roast.ts`

Nova procedure:

```typescript
createRoast: baseProcedure
  .input(z.object({
    code: z.string().max(500 * 200), // ~500 linhas * 200 chars
    language: z.string().max(50),
    roastMode: z.boolean(),
  }))
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

### 4. Client Component (HomeEditor)

**File:** `src/app/home-editor.tsx`

- Adicionar onClick que chama mutation
- Usar useTRPC + useMutation
- Redirect para /roast/[id] após sucesso
- Loading state no botão

```typescript
'use client';

import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

function HomeEditor() {
  const trpc = useTRPC();
  const router = useRouter();
  // ... existing state

  const createRoastMutation = useMutation(
    trpc.roast.createRoast.mutationOptions({
      onSuccess: (data) => {
        router.push(`/roast/${data.id}`);
      },
    })
  );

  const handleSubmit = () => {
    createRoastMutation.mutate({
      code,
      language: "javascript", // detectar automaticamente depois
      roastMode,
    });
  };

  // ... rest
}
```

### 5. Ollama Prompt Strategy

**Normal Mode (roastMode: false):**
```
Analyze this {language} code and provide a brutally honest but constructive critique.

Return JSON:
{
  "score": <0-10>,
  "verdict": "needs_serious_help" | "rough_around_edges" | "decent_code" | "solid_work" | "exceptional",
  "roastQuote": "<constructive feedback quote>",
  "issues": [
    {"severity": "critical" | "warning" | "good", "title": "<issue>", "description": "<explanation>"}
  ],
  "suggestedFix": "<optional code improvement>"
}
```

**Roast Mode (roastMode: true):**
```
Roast this {language} code with MAXIMUM SARCASM. Be brutal, mean, and funny. Don't hold back.

Return JSON:
{
  "score": <0-10>,
  "verdict": "needs_serious_help" | "rough_around_edges" | "decent_code" | "solid_work" | "exceptional",
  "roastQuote": "<EXTREMELY sarcastic roast quote>",
  "issues": [
    {"severity": "critical" | "warning" | "good", "title": "<sarcastic issue title>", "description": "<roasting explanation>"}
  ],
  "suggestedFix": "<sarcastic suggested improvement>"
}
```

## Implementation Order

1. AI Service (`src/services/ai/roast-ai.ts`)
2. Database Query (`src/db/queries/create-roast.ts`)
3. Export Query (`src/db/queries/index.ts`)
4. tRPC Mutation (`src/trpc/routers/roast.ts`)
5. Client Component (`src/app/home-editor.tsx`)
6. Update Roast Page (`src/app/roast/[id]/page.tsx`)

## Files to Create

- `src/services/ai/roast-ai.ts`
- `src/db/queries/create-roast.ts`

## Files to Modify

- `src/db/queries/index.ts`
- `src/trpc/routers/roast.ts`
- `src/app/home-editor.tsx`
- `src/app/roast/[id]/page.tsx`

## Environment Variables

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=codellama
```

## Error Handling

- Ollama offline → Show error toast, allow retry
- Invalid response format → Parse with fallback, log error
- Database error → Show error toast, log for debugging
- Code too long → Already validated in CodeEditor (maxLength)

## Out of Scope (for now)

- Share roast functionality
- Authentication
- Rate limiting
- Auto-detect language (starts with "javascript")
