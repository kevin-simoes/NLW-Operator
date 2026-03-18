"use client";

import { Collapsible } from "@base-ui/react";
import type { BundledLanguage } from "shiki";
import { CodeBlock, CodeBlockHeader } from "./code-block";

type CollapsibleCodeBlockProps = {
  code: string;
  lang: BundledLanguage;
  maxLines?: number;
  filename?: string;
};

function CollapsibleCodePreview({
  code,
  maxLines = 3,
}: {
  code: string;
  maxLines: number;
}) {
  const lines = code.split("\n");
  const previewLines = lines.slice(0, maxLines);

  return (
    <div className="flex flex-col">
      <div className="flex bg-bg-input">
        <div className="flex flex-col items-end gap-1.5 py-3 px-2.5 w-10 border-r border-border-primary bg-bg-surface select-none">
          {previewLines.map((_, idx) => (
            <span
              key={`ln-${idx}`}
              className="font-mono text-[13px] leading-tight text-text-tertiary"
            >
              {idx + 1}
            </span>
          ))}
        </div>

        <div className="flex-1 p-3 overflow-x-auto font-mono text-[13px] leading-tight relative">
          {previewLines.map((line, idx) => (
            <div
              key={`line-${idx}`}
              className={`leading-[1.65] ${
                line.startsWith("//") || line.startsWith("--")
                  ? "text-text-tertiary"
                  : "text-text-primary"
              }`}
            >
              {line}
            </div>
          ))}

          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-input to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

export function CollapsibleCodeBlock({
  code,
  lang,
  maxLines = 3,
  filename,
}: CollapsibleCodeBlockProps) {
  const lines = code.split("\n");
  const needsCollapsible = lines.length > maxLines;

  if (!needsCollapsible) {
    return (
      <div className="flex flex-col">
        <CodeBlockHeader filename={filename} />
        <CodeBlock
          code={code}
          lang={lang}
          className="border-0 rounded-t-none"
        />
      </div>
    );
  }

  return (
    <Collapsible.Root>
      <div className="flex flex-col">
        <Collapsible.Trigger className="group flex items-center justify-between h-10 px-4 border-b border-border-primary bg-bg-surface hover:bg-bg-elevated transition-colors cursor-pointer">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-accent-red" />
            <span className="size-2.5 rounded-full bg-accent-amber" />
            <span className="size-2.5 rounded-full bg-accent-green" />
          </span>
          <span className="font-mono text-xs text-text-tertiary">
            expand {">"}
            {">"}
          </span>
        </Collapsible.Trigger>

        <Collapsible.Panel className="data-[closed]:hidden">
          <CollapsibleCodePreview code={code} maxLines={maxLines} />
        </Collapsible.Panel>

        <Collapsible.Panel hidden className="data-[open]:hidden">
          <CollapsibleCodeFull code={code} lang={lang} filename={filename} />
        </Collapsible.Panel>
      </div>
    </Collapsible.Root>
  );
}

function CollapsibleCodeFull({
  code,
  lang,
  filename,
}: {
  code: string;
  lang: BundledLanguage;
  filename?: string;
}) {
  return (
    <div className="flex flex-col">
      <CodeBlockHeader filename={filename} />
      <CodeBlock code={code} lang={lang} className="border-0 rounded-t-none" />
    </div>
  );
}
