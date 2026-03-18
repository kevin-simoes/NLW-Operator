export type Language = {
  id: string;
  name: string;
};

export const SUPPORTED_LANGUAGES: Language[] = [
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "jsx", name: "JSX" },
  { id: "tsx", name: "TSX" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "go", name: "Go" },
  { id: "rust", name: "Rust" },
  { id: "csharp", name: "C#" },
  { id: "php", name: "PHP" },
  { id: "ruby", name: "Ruby" },
  { id: "swift", name: "Swift" },
  { id: "kotlin", name: "Kotlin" },
  { id: "sql", name: "SQL" },
  { id: "json", name: "JSON" },
  { id: "yaml", name: "YAML" },
  { id: "xml", name: "XML" },
  { id: "markdown", name: "Markdown" },
  { id: "bash", name: "Bash" },
  { id: "shell", name: "Shell" },
  { id: "docker", name: "Docker" },
  { id: "plaintext", name: "Plain Text" },
];

export const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  sh: "shell",
  yml: "yaml",
  md: "markdown",
  c: "csharp",
  cpp: "csharp",
  "c#": "csharp",
};

export function normalizeLanguage(lang: string): string {
  const normalized = lang.toLowerCase().trim();

  if (LANGUAGE_ALIASES[normalized]) {
    return LANGUAGE_ALIASES[normalized];
  }

  const found = SUPPORTED_LANGUAGES.find(
    (l) => l.id === normalized || l.name.toLowerCase() === normalized,
  );

  return found?.id ?? "plaintext";
}

export function getLanguageById(id: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.id === id);
}
