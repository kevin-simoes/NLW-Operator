# Especificação: Editor de Código com Syntax Highlighting

## 1. Visão Geral

Editor de código editável com syntax highlighting automático e opcionalmente manual, baseado nas melhores práticas do mercado (incluindo análise do ray.so).

## 2. Referências

### 2.1 Ray.so (Referência Principal)

O [ray.so](https://ray.so) (código aberto em [github.com/raycast/ray-so](https://github.com/raycast/ray-so)) utiliza:

- **Shiki** (`shiki`: ^1.0.0) - Biblioteca principal para syntax highlighting
- Highlighter baseado em TextMate grammars (mesmo sistema do VS Code)
- Suporte a WASM para performance
- Tema customizável + temas light/dark

### 2.2 Bibliotecas Recomendadas

| Biblioteca | Tipo | Características |
|------------|------|-----------------|
| **Shiki** | Highlighting | Server-side rendering, TextMate grammars (VS Code),Themes 100+, WASM |
| **Monaco Editor** | Editor completo | VS Code embeddado, auto-complete, minimap |
| **CodeMirror 6** | Editor completo | Extensível, leve, mobile-friendly |
| **@uiw/react-codemirror** | Editor completo | Wrapper CodeMirror para React |

## 3. Decisão Técnica Recomendada

### 3.1 Biblioteca Principal: Shiki

**Justificativa:**
- Renderização server-side (zero JavaScript client-side para highlighting)
- Mesma experiência visual do VS Code
- +100 temas disponíveis
- Suporte a 100+ linguagens
- Integração nativa com Next.js App Router
- Usado por Vercel (Next.js docs), Astro, e outros projetos de referência

### 3.2 Biblioteca de Detecção de Linguagem: highlight.js (para fallback)

Usar `highlight.js` para detecção automática de linguagem quando Shiki não conseguir identificar.

## 4. Arquitetura Sugerida

### 4.1 Componentes

```
src/
  components/
    ui/
      code-editor/           # Pasta do componente
        index.tsx            # Export principal
        CodeEditor.tsx       # Componente editável
        CodeBlock.tsx        # Componente somente-leitura
        LanguageSelector.tsx  # Dropdown de seleção manual
        useLanguageDetection.ts # Hook para auto-detecção
        themes.ts            # Configuração de temas
        languages.ts         # Lista de linguagens suportadas
```

### 4.2 API do Componente

```typescript
interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;                    // Manual override
  autoDetect?: boolean;                // Default: true
  theme?: 'light' | 'dark' | 'auto';   // Default: 'auto'
  showLanguageSelector?: boolean;      // Default: true
  readOnly?: boolean;                  // Default: false
  lineNumbers?: boolean;               // Default: true
  onLanguageChange?: (lang: string) => void;
}
```

## 5. Detecção Automática de Linguagem

### 5.1 Estratégia

1. **Tentativa primária**: Usar Shiki com detecção automática
2. **Fallback**: highlight.js para identificar linguagem
3. **Default**: `plaintext` se nenhuma detecção funcionar

### 5.2 Implementação Sugerida

```typescript
// useLanguageDetection.ts
import { createHighlighter, bundledLanguages } from 'shiki';
import hljs from 'highlight.js';

export function useLanguageDetection() {
  const detectLanguage = async (code: string): Promise<string> => {
    // 1. Tentar Shiki
    try {
      const language = await shiki.getLanguage(code);
      if (language) return language.id;
    } catch {
      // Continuar para fallback
    }

    // 2. Fallback: highlight.js
    const result = hljs.highlightAuto(code);
    return result.language || 'plaintext';
  };

  return { detectLanguage };
}
```

## 6. Lista de Linguagens Prioritárias

Suporte inicial recomendado (expansível):

| Categoria | Linguagens |
|-----------|------------|
| Web | JavaScript, TypeScript, HTML, CSS, JSX, TSX |
| Backend | Python, Java, Go, Rust, C#, PHP, Ruby |
| Mobile | Swift, Kotlin |
| Dados | SQL, JSON, YAML, XML, Markdown |
| Sistemas | Bash, Shell, Docker |

## 7. Integração com Tailwind CSS v4

O projeto usa Tailwind v4 com `@theme`. Sugestão de integração:

```typescript
// components/ui/code-editor/themes.ts
import { defineConfig } from 'tailwindcss';

export const editorTheme = defineConfig({
  theme: {
    extend: {
      colors: {
        'code-bg': 'var(--color-neutral-900)',
        'code-text': 'var(--color-neutral-100)',
      },
    },
  },
});
```

## 8. Considerações de Performance

- **Shiki com WASM**: Carregamento async do WebAssembly
- **Lazy loading**: Carregar linguagens sob demanda
- **Server Components**: Usar `CodeBlock` como RSC para conteúdo estático
- **Cache**: Implementar cache para código já processado

## 9. Funcionalidades Extras Sugeridas

- [ ] Copy to clipboard
- [ ] Line highlighting (destacar linhas específicas)
- [ ] Line numbers toggle
- [ ] Word wrap toggle
- [ ] Diff highlighting (adicionar/remover linhas)
- [ ] Filename display

## 10. Próximos Passos

1. Instalar dependências: `pnpm add shiki highlight.js`
2. Criar componente base `CodeBlock` (RSC)
3. Implementar `CodeEditor` com Monaco ou CodeMirror
4. Adicionar `LanguageSelector`
5. Implementar hook de auto-detecção
6. Integrar com o design system do projeto

## 11. Referências Adicionais

- [Shiki Documentation](https://shiki.style)
- [highlight.js Documentation](https://highlightjs.org)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [CodeMirror 6](https://codemirror.net/)
