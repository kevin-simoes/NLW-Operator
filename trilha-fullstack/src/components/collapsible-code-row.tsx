"use client";

import { Collapsible } from "@base-ui/react";

type CollapsibleCodeRowProps = {
  code: string;
  lang: string;
  maxLines?: number;
};

export function CollapsibleCodeRow({
  code,
  lang,
  maxLines = 4,
}: CollapsibleCodeRowProps) {
  const lines = code.split("\n");
  const needsCollapsible = lines.length > maxLines;
  const previewLines = lines.slice(0, maxLines);

  return (
    <Collapsible.Root>
      <div className="flex flex-col">
        <div className="flex bg-bg-input">
          <div className="flex flex-col items-end gap-1.5 py-2 px-2 w-8 border-r border-border-primary bg-bg-surface select-none">
            {previewLines.map((_, idx) => (
              <span
                key={`ln-${idx}`}
                className="font-mono text-[11px] leading-tight text-text-tertiary"
              >
                {idx + 1}
              </span>
            ))}
          </div>

          <div className="flex-1 p-2 overflow-x-auto font-mono text-[12px] leading-tight relative">
            {previewLines.map((line, idx) => (
              <div
                key={`line-${idx}`}
                className={`leading-[1.5] ${
                  line.startsWith("//") || line.startsWith("--")
                    ? "text-text-tertiary"
                    : "text-text-primary"
                }`}
              >
                {line}
              </div>
            ))}

            {needsCollapsible && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-input to-transparent pointer-events-none" />
            )}
          </div>
        </div>

        {needsCollapsible && (
          <Collapsible.Trigger className="group flex items-center justify-between h-8 px-3 border-t border-border-primary bg-bg-surface hover:bg-bg-elevated transition-colors cursor-pointer">
            <span className="font-mono text-xs text-text-tertiary">{lang}</span>
            <span className="font-mono text-xs text-text-tertiary group-data-[open]:hidden">
              show more
            </span>
            <span className="font-mono text-xs text-text-tertiary hidden group-data-[open]:block">
              show less
            </span>
          </Collapsible.Trigger>
        )}

        <Collapsible.Panel hidden className="data-[open]:hidden">
          <div className="flex bg-bg-input">
            <div className="flex flex-col items-end gap-1.5 py-2 px-2 w-8 border-r border-border-primary bg-bg-surface select-none">
              {lines.map((_, idx) => (
                <span
                  key={`ln-full-${idx}`}
                  className="font-mono text-[11px] leading-tight text-text-tertiary"
                >
                  {idx + 1}
                </span>
              ))}
            </div>

            <div className="flex-1 p-2 overflow-x-auto font-mono text-[12px] leading-tight">
              {lines.map((line, idx) => (
                <div
                  key={`line-full-${idx}`}
                  className={`leading-[1.5] ${
                    line.startsWith("//") || line.startsWith("--")
                      ? "text-text-tertiary"
                      : "text-text-primary"
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </Collapsible.Panel>
      </div>
    </Collapsible.Root>
  );
}
