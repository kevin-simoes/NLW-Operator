"use client";

import { Collapsible } from "@base-ui/react";
import { useEffect, useState } from "react";
import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";

type CollapsibleCodeRowProps = {
  code: string;
  lang: BundledLanguage;
  maxLines?: number;
};

export function CollapsibleCodeRow({
  code,
  lang,
  maxLines = 10,
}: CollapsibleCodeRowProps) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [fullHtml, setFullHtml] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const lines = code.split("\n");
  const needsCollapsible = lines.length > maxLines;
  const previewLines = lines.slice(0, maxLines).join("\n");

  useEffect(() => {
    let cancelled = false;

    codeToHtml(previewLines, { lang, theme: "vesper" }).then((html) => {
      if (!cancelled) setPreviewHtml(html);
    });

    codeToHtml(code, { lang, theme: "vesper" }).then((html) => {
      if (!cancelled) setFullHtml(html);
    });

    return () => {
      cancelled = true;
    };
  }, [previewLines, code, lang]);

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col">
        <div className="flex bg-bg-input">
          <div className="flex flex-col items-end gap-1.5 py-2 px-2 w-8 border-r border-border-primary bg-bg-surface select-none">
            {(isOpen ? lines : lines.slice(0, maxLines)).map((_, idx) => (
              <span
                key={`ln-${idx}`}
                className="font-mono text-[11px] leading-tight text-text-tertiary"
              >
                {idx + 1}
              </span>
            ))}
          </div>

          <div className="flex-1 p-2 overflow-x-auto relative">
            {previewHtml ? (
              <div
                className="font-mono text-[12px] leading-tight [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_code]:!bg-transparent [&_.line]:leading-[1.5]"
                dangerouslySetInnerHTML={{
                  __html: isOpen && fullHtml ? fullHtml : previewHtml,
                }}
              />
            ) : (
              <div className="font-mono text-[12px] leading-tight text-text-tertiary">
                Loading...
              </div>
            )}

            {needsCollapsible && !isOpen && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-input to-transparent pointer-events-none" />
            )}
          </div>
        </div>

        {needsCollapsible && (
          <Collapsible.Trigger className="group flex items-center justify-between h-8 px-3 border-t border-border-primary bg-bg-surface hover:bg-bg-elevated transition-colors cursor-pointer">
            <span className="font-mono text-xs text-text-tertiary">{lang}</span>
            <span className="font-mono text-xs text-text-tertiary group-data-[state=open]:hidden">
              show all ({lines.length} lines)
            </span>
            <span className="font-mono text-xs text-text-tertiary group-data-[state=closed]:hidden">
              show less
            </span>
          </Collapsible.Trigger>
        )}
      </div>
    </Collapsible.Root>
  );
}
