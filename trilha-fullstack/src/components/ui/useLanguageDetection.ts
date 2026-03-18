"use client";

import { useCallback, useEffect, useState } from "react";

const LANGUAGE_PATTERNS: Array<{ patterns: RegExp[]; lang: string }> = [
  {
    patterns: [
      /^\s*import\s+.*from\s+['"]|export\s+(default\s+)?(const|let|var|function|class)|=>\s*{/m,
    ],
    lang: "typescript",
  },
  {
    patterns: [
      /^\s*def\s+\w+\s*\(|print\s*\(|if\s+__name__\s*==\s*['"]__main__['"]/m,
    ],
    lang: "python",
  },
  { patterns: [/^\s*<\?php|^\s*\$\w+\s*=/m], lang: "php" },
  {
    patterns: [/^\s*package\s+\w+|func\s+\w+\s*\(|:=\s*|fmt\.\w+/m],
    lang: "go",
  },
  {
    patterns: [/^\s*public\s+(class|static|void)|System\.\w+|import\s+java\./m],
    lang: "java",
  },
  {
    patterns: [/^\s*(fn|let|mut|impl|struct|enum|use\s+\w+::)/m],
    lang: "rust",
  },
  {
    patterns: [/^\s*(namespace|using|class|public|private)\s+\w+/m],
    lang: "csharp",
  },
  {
    patterns: [/^\s*<!DOCTYPE\s+html|<html|<head|<body|<div|<span/m],
    lang: "html",
  },
  { patterns: [/^\s*\{[\s\S]*"[\w]+"\s*:\s*[\s\S]*\}/m], lang: "json" },
  { patterns: [/^\s*<\?xml|^\s*<[\w-]+[\s>]/m], lang: "xml" },
  {
    patterns: [/^\s*#!\/bin\/(bash|sh)|^\s*(if|then|fi|echo|export)\s+/m],
    lang: "bash",
  },
  {
    patterns: [/^\s*(FROM|RUN|CMD|COPY|ENV|EXPOSE|WORKDIR|ENTRYPOINT)/m],
    lang: "docker",
  },
  {
    patterns: [/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s+/im],
    lang: "sql",
  },
  { patterns: [/^\s*#\s+\w+|^\s*```\w*|^\s*-\s+\w+/m], lang: "markdown" },
  { patterns: [/^\s*---\s*\w+:|^\s*\w+:\s*[\s\S]*$/m], lang: "yaml" },
  { patterns: [/^\s*[\w-]+\s*:\s*[\s\S]*;[\s\S]*\{[\s\S]*\}/m], lang: "css" },
];

function quickDetect(code: string): string {
  for (const { patterns, lang } of LANGUAGE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        return lang;
      }
    }
  }

  return "plaintext";
}

export function useLanguageDetection() {
  const [isDetecting, setIsDetecting] = useState(false);

  const detectLanguage = useCallback(async (code: string): Promise<string> => {
    if (!code.trim()) {
      return "plaintext";
    }

    setIsDetecting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return quickDetect(code);
    } catch {
      return "plaintext";
    } finally {
      setIsDetecting(false);
    }
  }, []);

  return { detectLanguage, isDetecting };
}

export function useAutoLanguage(
  code: string,
  autoDetect: boolean,
  manualLanguage?: string,
) {
  const [language, setLanguage] = useState<string>(
    manualLanguage ?? "plaintext",
  );
  const { detectLanguage, isDetecting } = useLanguageDetection();

  useEffect(() => {
    if (manualLanguage) {
      setLanguage(manualLanguage);
      return;
    }

    if (!autoDetect) {
      setLanguage("plaintext");
      return;
    }

    detectLanguage(code).then(setLanguage);
  }, [code, manualLanguage, autoDetect, detectLanguage]);

  return { language, setLanguage, isDetecting };
}
