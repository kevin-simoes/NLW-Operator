"use client";

import { useCallback, useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { twMerge } from "tailwind-merge";
import { LanguageSelector } from "./language-selector";
import { normalizeLanguage } from "./languages";
import { useAutoLanguage } from "./useLanguageDetection";

export type CodeEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  autoDetect?: boolean;
  theme?: "light" | "dark" | "auto";
  showLanguageSelector?: boolean;
  showHeader?: boolean;
  filename?: string;
  className?: string;
  onLanguageChange?: (lang: string) => void;
  maxLength?: number;
  onCountChange?: (count: number, isOverLimit: boolean) => void;
};

async function highlightCode(
  code: string,
  lang: string,
  theme: "light" | "dark" | "auto",
): Promise<string> {
  const themeName =
    theme === "auto" ? "vesper" : theme === "dark" ? "vesper" : "github-light";

  try {
    const normalizedLang = normalizeLanguage(lang);
    const html = await codeToHtml(code, {
      lang: normalizedLang,
      theme: themeName,
    });
    return html;
  } catch {
    const html = await codeToHtml(code, {
      lang: "plaintext",
      theme: themeName,
    });
    return html;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function CodeEditor({
  value,
  onChange,
  language: manualLanguage,
  autoDetect = true,
  theme = "auto",
  showLanguageSelector = true,
  showHeader = true,
  filename,
  className,
  onLanguageChange,
  maxLength = 5000,
  onCountChange,
}: CodeEditorProps) {
  const [html, setHtml] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const charCount = value.length;
  const isOverLimit = charCount > maxLength;

  const { language, setLanguage, isDetecting } = useAutoLanguage(
    value,
    autoDetect,
    manualLanguage,
  );

  const hasContent = value.trim().length > 0;
  const showPreview = hasContent && !isEditing;

  useEffect(() => {
    onCountChange?.(charCount, isOverLimit);
  }, [charCount, isOverLimit, onCountChange]);

  useEffect(() => {
    if (!value) {
      setHtml("");
      setIsHighlighting(false);
      return;
    }

    setIsHighlighting(true);
    highlightCode(value, language, theme).then((result) => {
      setHtml(result);
      setIsHighlighting(false);
    });
  }, [value, language, theme]);

  const handleLanguageChange = useCallback(
    (newLang: string) => {
      setLanguage(newLang);
      onLanguageChange?.(newLang);
    },
    [setLanguage, onLanguageChange],
  );

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    },
    [onChange],
  );

  const toggleEdit = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const lines = value.split("\n");

  return (
    <div
      className={twMerge(
        "border border-border-primary overflow-hidden rounded-lg",
        className,
      )}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-3 h-10 px-4 border-b border-border-primary bg-bg-surface">
          <span className="size-2.5 rounded-full bg-accent-red" />
          <span className="size-2.5 rounded-full bg-accent-amber" />
          <span className="size-2.5 rounded-full bg-accent-green" />
          <span className="flex-1" />
          {filename && (
            <span className="font-mono text-xs text-text-tertiary">
              {filename}
            </span>
          )}
          <button
            type="button"
            onClick={toggleEdit}
            className="font-mono text-xs px-2 py-1 rounded bg-bg-input hover:bg-bg-elevated text-text-secondary transition-colors"
          >
            {isEditing ? "Preview" : "Edit"}
          </button>
          {showLanguageSelector && (
            <LanguageSelector
              value={language}
              onChange={handleLanguageChange}
              disabled={isDetecting}
            />
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex bg-bg-input min-h-[100px] max-h-[500px] overflow-y-auto scrollbar-thin">
        {/* Line numbers */}
        {showPreview && (
          <div className="flex flex-col items-end gap-1.5 py-3 px-2.5 w-10 bg-bg-surface select-none shrink-0">
            {lines.map((_, i) => (
              <span
                key={`ln-${i.toString()}`}
                className="font-mono text-[13px] leading-tight text-text-tertiary"
              >
                {i + 1}
              </span>
            ))}
          </div>
        )}

        {/* Code display/edit area */}
        {showPreview ? (
          <div className="flex-1 relative">
            <div
              className="p-3 font-mono text-[13px] leading-tight [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_code]:!bg-transparent [&_.line]:leading-[1.65] overflow-x-auto"
              dangerouslySetInnerHTML={{
                __html: html || `<pre><code>${escapeHtml(value)}</code></pre>`,
              }}
            />
            {/* Character count */}
            <div className="absolute bottom-2 right-3 font-mono text-[11px] text-text-tertiary">
              <span className={isOverLimit ? "text-accent-red" : ""}>
                {charCount}
              </span>
              <span className="text-text-tertiary">/{maxLength}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 relative">
            <textarea
              value={value}
              onChange={handleCodeChange}
              maxLength={maxLength}
              className={twMerge(
                "w-full h-full p-3 font-mono text-[13px] leading-tight max-h-[500px]",
                "bg-transparent text-text-primary resize-none outline-none",
                "placeholder:text-text-tertiary",
              )}
              placeholder="Paste or type your code here..."
              spellCheck={false}
            />
            {/* Character count */}
            <div className="absolute bottom-2 right-3 font-mono text-[11px] text-text-tertiary">
              <span className={isOverLimit ? "text-accent-red" : ""}>
                {charCount}
              </span>
              <span className="text-text-tertiary">/{maxLength}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { CodeEditor };
