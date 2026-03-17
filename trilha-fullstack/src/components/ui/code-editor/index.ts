export type { CodeEditorProps } from "./code-editor";
export { CodeEditor } from "./code-editor";
export type { LanguageSelectorProps } from "./language-selector";
export { LanguageSelector } from "./language-selector";
export {
  getLanguageById,
  LANGUAGE_ALIASES,
  type Language,
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
} from "./languages";
export { useAutoLanguage, useLanguageDetection } from "./useLanguageDetection";
