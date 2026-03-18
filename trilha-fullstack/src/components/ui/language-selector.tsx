import type { ComponentProps } from "react";
import { tv } from "tailwind-variants";
import { SUPPORTED_LANGUAGES } from "./languages";

const languageSelector = tv({
  base: [
    "flex",
    "items-center",
    "gap-2",
    "px-3",
    "py-1.5",
    "rounded-md",
    "bg-bg-input",
    "border",
    "border-border-primary",
    "text-sm",
    "font-mono",
    "text-text-primary",
    "cursor-pointer",
    "transition-colors",
    "hover:border-border-secondary",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-accent-green",
    "focus:ring-offset-2",
    "focus:ring-offset-bg-page",
  ],
});

type LanguageSelectorProps = Omit<
  ComponentProps<"select">,
  "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
};

function LanguageSelector({
  value,
  onChange,
  className,
  ...props
}: LanguageSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={languageSelector({ className })}
        {...props}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export { LanguageSelector, languageSelector, type LanguageSelectorProps };
