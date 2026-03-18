const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "codellama";
const USE_MOCK = process.env.USE_MOCK_AI === "true";

export interface Issue {
  severity: "critical" | "warning" | "good";
  title: string;
  description: string;
  location?: string;
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
  detectedPatterns: string[];
  detectedVariables: string[];
}

const MOCK_QUOTES: Record<VerdictType, string[]> = {
  needs_serious_help: [
    "This code made my eyes bleed a little...",
    "Even ChatGPT couldn't save this one, buddy.",
    "Stack Overflow cried when it saw this.",
    "Worse than cold pizza at 3 AM.",
  ],
  rough_around_edges: [
    "Does it work? Yes. Is it pretty? Absolutely not.",
    "Almost there, just needs some love.",
    "This will haunt you one day, but for now it'll do.",
  ],
  decent_code: [
    "Alright, I can work with this. Not amazing, but not painful.",
    "Pretty solid, but I've seen better code on GitHub at 3 AM.",
    "Not bad, but the office crew still prefers the coffee.",
  ],
  solid_work: [
    "Now THIS is code with style!",
    "Look at that! Someone actually knows what they're doing!",
    "If code were pizza, this would be artisanal pepperoni.",
  ],
  exceptional: [
    "HOLY COW! This is a masterpiece!",
    "Hire this person immediately! NASA needs them!",
    "This deserves a Nobel Prize in Programming!",
  ],
};

const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  javascript: [
    "const",
    "let",
    "var",
    "function",
    "async",
    "await",
    "return",
    "if",
    "else",
    "for",
    "while",
    "class",
    "import",
    "export",
    "try",
    "catch",
    "throw",
    "new",
    "this",
    "typeof",
    "instanceof",
  ],
  typescript: [
    "const",
    "let",
    "var",
    "function",
    "async",
    "await",
    "return",
    "if",
    "else",
    "for",
    "while",
    "class",
    "import",
    "export",
    "try",
    "catch",
    "throw",
    "new",
    "this",
    "typeof",
    "instanceof",
    "interface",
    "type",
    "enum",
    "implements",
    "extends",
    "public",
    "private",
    "protected",
  ],
  python: [
    "def",
    "class",
    "import",
    "from",
    "if",
    "elif",
    "else",
    "for",
    "while",
    "try",
    "except",
    "finally",
    "with",
    "as",
    "return",
    "yield",
    "lambda",
    "async",
    "await",
  ],
  java: [
    "public",
    "private",
    "protected",
    "class",
    "interface",
    "extends",
    "implements",
    "static",
    "final",
    "void",
    "return",
    "if",
    "else",
    "for",
    "while",
    "try",
    "catch",
    "throw",
    "new",
    "this",
    "super",
  ],
  go: [
    "func",
    "package",
    "import",
    "var",
    "const",
    "type",
    "struct",
    "interface",
    "return",
    "if",
    "else",
    "for",
    "range",
    "go",
    "chan",
    "defer",
    "select",
  ],
  rust: [
    "fn",
    "let",
    "mut",
    "const",
    "struct",
    "impl",
    "trait",
    "pub",
    "mod",
    "use",
    "self",
    "Super",
    "if",
    "else",
    "match",
    "loop",
    "while",
    "for",
    "return",
    "async",
    "await",
  ],
};

function detectVariables(code: string, language: string): string[] {
  const variables: string[] = [];
  const keywords = LANGUAGE_KEYWORDS[language] || LANGUAGE_KEYWORDS.javascript;

  const patterns = [
    /(?:const|let|var)\s+(\w+)/g,
    /(?:function\s+(\w+))/g,
    /(?:def\s+(\w+))/g,
    /(?:func\s+(\w+))/g,
    /(?:fn\s+(\w+))/g,
    /(?:class\s+(\w+))/g,
    /(\w+)\s*=/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null = pattern.exec(code);
    while (match !== null) {
      const varName = match[1];
      if (
        !keywords.includes(varName) &&
        varName.length > 1 &&
        !/^\d/.test(varName)
      ) {
        if (!variables.includes(varName)) {
          variables.push(varName);
        }
      }
      match = pattern.exec(code);
    }
  }

  return variables.slice(0, 10);
}

function detectPatterns(code: string, language: string): string[] {
  const patterns: string[] = [];

  if (code.includes("console.log")) patterns.push("Console logging detected");
  if (code.includes("debugger")) patterns.push("Debugger statements found");
  if (code.includes("alert(")) patterns.push("Alert dialog used");
  if (code.includes("document.write"))
    patterns.push("Dangerous document.write usage");
  if (code.includes("innerHTML"))
    patterns.push("innerHTML manipulation - XSS risk");
  if (code.includes("eval(")) patterns.push("eval() usage - security concern");
  if (code.includes("setTimeout") && code.includes("string"))
    patterns.push("setTimeout with string - eval-like pattern");

  if (code.includes("for (") || code.includes("for("))
    patterns.push("C-style for loop");
  if (code.includes("forEach")) patterns.push("forEach iteration");
  if (code.includes("map(")) patterns.push("map() transformation");
  if (code.includes("filter(")) patterns.push("filter() operation");
  if (code.includes("reduce(")) patterns.push("reduce() aggregation");

  if (code.includes("Promise")) patterns.push("Promise-based async");
  if (code.includes("async") && code.includes("await"))
    patterns.push("Async/await pattern");
  if (code.includes(".then(")) patterns.push("Promise chaining");

  if (code.includes("try") && code.includes("catch"))
    patterns.push("Error handling present");
  if (code.includes("throw")) patterns.push("Exception throwing");

  if (code.includes("// TODO") || code.includes("// FIXME"))
    patterns.push("Unresolved TODOs/FIXMEs");
  if (code.includes("/*") && code.includes("*/"))
    patterns.push("Multi-line comments present");

  if (code.includes("===") || code.includes("!=="))
    patterns.push("Strict equality used");
  if (code.includes("==") || code.includes("!="))
    patterns.push("Loose equality - consider strict");

  if (code.includes("var ")) patterns.push("var keyword - use let/const");
  if (code.includes("let ")) patterns.push("let declaration");
  if (code.includes("const ")) patterns.push("const declaration");

  if (code.includes("class ")) patterns.push("OOP class usage");
  if (code.includes("extends ")) patterns.push("Class inheritance");
  if (code.includes("interface ")) patterns.push("TypeScript interface");
  if (code.includes("type ")) patterns.push("TypeScript type definition");

  if (code.includes("import ")) patterns.push("Module imports");
  if (code.includes("require(")) patterns.push("CommonJS require");
  if (code.includes("export ")) patterns.push("Module exports");

  const lines = code.split("\n").length;
  if (lines > 50) patterns.push(`Large function (${lines} lines)`);
  if (lines <= 5) patterns.push("Concise code");

  const nestedBraces = (code.match(/{/g) || []).length;
  if (nestedBraces > 10) patterns.push("Deep nesting detected");

  return patterns;
}

function generateSuggestedFix(
  code: string,
  language: string,
  issues: Issue[],
): string {
  let fix = "";

  const hasVar = issues.some((i) => i.title.includes("var"));
  const hasConsole = issues.some((i) => i.title.includes("Console"));
  const hasTodo = issues.some((i) => i.title.includes("TODO"));
  const hasLooseEquality = issues.some((i) =>
    i.title.includes("Loose equality"),
  );
  const hasNoErrorHandling = !issues.some((i) =>
    i.title.includes("Error handling"),
  );

  if (hasVar) {
    fix += "// Replace 'var' with 'const' or 'let'\n";
    fix += code.replace(/\bvar\s+/g, "const ") + "\n\n";
  }

  if (hasConsole) {
    fix += "// Remove console.log or use a proper logging library\n";
    fix += "// import logger from 'pino';\n";
  }

  if (hasTodo) {
    fix += "// TODO: Resolve all TODO comments before production\n";
    fix += "// TODO: Implement proper error handling\n";
  }

  if (hasLooseEquality) {
    fix += "// Use strict equality (===) instead of loose equality (==)\n";
    fix += code.replace(/([^=!])={2}([^=])/g, "$1===$2") + "\n";
  }

  if (
    hasNoErrorHandling &&
    (code.includes("fetch") ||
      code.includes("await") ||
      code.includes("Promise"))
  ) {
    fix += "// Add try/catch for error handling\n";
    fix += "try {\n";
    fix +=
      code
        .split("\n")
        .map((line) => "  " + line)
        .join("\n") + "\n";
    fix += "} catch (error) {\n";
    fix += "  console.error('An error occurred:', error);\n";
    fix += "}";
  }

  if (fix === "") {
    const indent = "  ";
    if (language === "javascript" || language === "typescript") {
      fix = `// Suggested improvement:\n${indent}// 1. Add input validation\n${indent}// 2. Add error handling\n${indent}// 3. Consider using TypeScript for type safety\n\n${code
        .split("\n")
        .map((line) => indent + line)
        .join("\n")}`;
    } else if (language === "python") {
      fix = `# Suggested improvement:\n${indent}# 1. Add input validation\n${indent}# 2. Add exception handling\n${indent}# 3. Add docstrings\n\n${code
        .split("\n")
        .map((line) => indent + line)
        .join("\n")}`;
    } else {
      fix = `// Suggested improvement:\n${indent}// Review and refactor for better practices\n\n${code
        .split("\n")
        .map((line) => indent + line)
        .join("\n")}`;
    }
  }

  return fix;
}

function getMockAnalysis(
  code: string,
  language: string,
  roastMode: boolean,
): RoastAnalysis {
  const issues: Issue[] = [];
  let score = 5;
  let verdict: VerdictType = "decent_code";

  const variables = detectVariables(code, language);
  const patterns = detectPatterns(code, language);

  if (code.includes("var")) {
    issues.push({
      severity: "warning",
      title: "Legacy 'var' keyword",
      description:
        "'var' is outdated. Use 'const' for immutable or 'let' for mutable variables.",
      location: "Variable declarations",
    });
    score -= 2;
  }

  if (code.includes("console.log")) {
    issues.push({
      severity: "warning",
      title: "Console logging in code",
      description:
        "Remove console.log statements before production. Use a proper logging library.",
      location: "Debug statements",
    });
    score -= 1;
  }

  if (code.includes("TODO") || code.includes("FIXME")) {
    issues.push({
      severity: "critical",
      title: "Unresolved TODOs",
      description:
        "TODO comments indicate incomplete work. Resolve them before shipping.",
      location: "Comments",
    });
    score -= 3;
  }

  if (code.includes("==") && !code.includes("===")) {
    issues.push({
      severity: "warning",
      title: "Loose equality comparison",
      description: "Use strict equality (===) to avoid type coercion bugs.",
      location: "Comparisons",
    });
    score -= 1;
  }

  if (code.includes("function ") || code.includes("=>")) {
    issues.push({
      severity: "good",
      title: "Function declarations present",
      description: "Good! Using functions to organize code logic.",
      location: "Function definitions",
    });
    score += 1;
  }

  if (code.includes("async") && code.includes("await")) {
    issues.push({
      severity: "good",
      title: "Modern async/await pattern",
      description: "Great use of async/await for readable asynchronous code.",
      location: "Async operations",
    });
    score += 1;
  }

  if (code.includes("try") && code.includes("catch")) {
    issues.push({
      severity: "good",
      title: "Error handling implemented",
      description: "Good job implementing error handling with try/catch!",
      location: "Exception handling",
    });
    score += 1;
  }

  if (code.includes("//") || code.includes("/*")) {
    issues.push({
      severity: "good",
      title: "Code comments present",
      description:
        "Comments found. Make sure they're meaningful and not just noise.",
      location: "Documentation",
    });
    score += 1;
  }

  if (code.length > 200) {
    issues.push({
      severity: "warning",
      title: "Large code block",
      description:
        "Consider breaking this into smaller, more manageable functions.",
      location: `~${Math.ceil(code.length / 50)} estimated logical blocks`,
    });
    score -= 1;
  }

  if (code.length < 10) {
    issues.push({
      severity: "warning",
      title: "Very short code snippet",
      description:
        "This is quite minimal. Are you sure there's enough context for analysis?",
      location: "Overall",
    });
    score -= 1;
  }

  if (code.includes("eval(")) {
    issues.push({
      severity: "critical",
      title: "eval() security risk",
      description:
        "Using eval() is dangerous. It can execute arbitrary code and poses security risks.",
      location: "eval usage",
    });
    score -= 4;
  }

  if (code.includes("innerHTML")) {
    issues.push({
      severity: "warning",
      title: "DOM XSS potential",
      description:
        "Direct innerHTML manipulation can lead to XSS attacks. Use textContent or sanitize input.",
      location: "DOM manipulation",
    });
    score -= 2;
  }

  if (code.includes("import ") && !code.includes("require(")) {
    issues.push({
      severity: "good",
      title: "ES Modules used",
      description: "Modern ES module imports detected. Good practice!",
      location: "Module imports",
    });
    score += 1;
  }

  if (code.includes("interface ") || code.includes("type ")) {
    issues.push({
      severity: "good",
      title: "TypeScript types defined",
      description:
        "Type definitions found. This helps with code safety and documentation.",
      location: "Type definitions",
    });
    score += 1;
  }

  if (issues.length === 0) {
    issues.push({
      severity: "good",
      title: "No obvious issues",
      description:
        "Couldn't find major problems. Looks reasonable at first glance.",
      location: "General",
    });
  }

  if (score <= 2) verdict = "needs_serious_help";
  else if (score <= 4) verdict = "rough_around_edges";
  else if (score <= 6) verdict = "decent_code";
  else if (score <= 8) verdict = "solid_work";
  else verdict = "exceptional";

  const quotes = MOCK_QUOTES[verdict];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const suggestedFix = generateSuggestedFix(code, language, issues);

  return {
    score: Math.max(0, Math.min(10, score)),
    verdict,
    roastQuote: roastMode ? quote : "Here's my honest analysis...",
    issues,
    suggestedFix,
    detectedPatterns: patterns,
    detectedVariables: variables,
  };
}

function buildPrompt(
  code: string,
  language: string,
  roastMode: boolean,
): string {
  const tone = roastMode ? "ROAST" : "review";
  return `[INST] ${language} ${tone}: ${code} JSON: {"s":0,"v":"bad","q":"","i":[]}
[/INST]`;
}

export async function analyzeCode(
  code: string,
  language: string,
  roastMode: boolean,
): Promise<RoastAnalysis> {
  if (USE_MOCK) {
    return getMockAnalysis(code, language, roastMode);
  }

  const prompt = buildPrompt(code, language, roastMode);

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: "json",
      options: {
        num_predict: 100,
        temperature: 0.9,
        top_p: 0.95,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama API error: ${response.status} - ${text}`);
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

    const parsed = JSON.parse(cleaned);
    const verdicts: Record<string, VerdictType> = {
      bad: "needs_serious_help",
      needs_serious_help: "needs_serious_help",
      rough: "rough_around_edges",
      rough_around_edges: "rough_around_edges",
      decent: "decent_code",
      decent_code: "decent_code",
      good: "solid_work",
      solid_work: "solid_work",
      solid: "solid_work",
      exceptional: "exceptional",
    };

    return {
      score: Math.max(0, Math.min(10, Number(parsed.s ?? parsed.score) || 5)),
      verdict: verdicts[parsed.v ?? parsed.verdict] ?? "decent_code",
      roastQuote: parsed.q ?? (parsed.roastQuote || "No comment."),
      issues: Array.isArray(parsed.i ?? parsed.issues)
        ? (parsed.i ?? parsed.issues)
        : [],
      suggestedFix: parsed.f ?? parsed.suggestedFix,
      detectedPatterns: [],
      detectedVariables: [],
    };
  } catch {
    console.error("Failed to parse Ollama response:", rawResponse);
    return {
      score: 5,
      verdict: "decent_code" as VerdictType,
      roastQuote: "The code... exists. That's something.",
      issues: [],
      detectedPatterns: [],
      detectedVariables: [],
    };
  }
}
