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

function buildPrompt(
  code: string,
  language: string,
  roastMode: boolean,
): string {
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
  roastMode: boolean,
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
  const rawResponse =
    typeof data.response === "string"
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
