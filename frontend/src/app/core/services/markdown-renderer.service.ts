import { Injectable } from '@angular/core';
import { Marked } from 'marked';
import Prism from 'prismjs';

// Carga de gramáticas de Prism
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-docker';

export interface FrontmatterMeta {
  fecha?: string;
  canal?: string;
  titulo?: string;
  tags: string[];
  otros: Array<{ key: string; val: string }>;
}

export interface ExtractedMarkdown {
  meta: FrontmatterMeta | null;
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class MarkdownRendererService {
  private readonly markedInstance: Marked;

  private readonly languageMap: Record<string, string> = {
    js: 'javascript',
    javascript: 'javascript',
    ts: 'typescript',
    typescript: 'typescript',
    py: 'python',
    python: 'python',
    sh: 'bash',
    bash: 'bash',
    shell: 'bash',
    zsh: 'bash',
    json: 'json',
    yml: 'yaml',
    yaml: 'yaml',
    sql: 'sql',
    md: 'markdown',
    markdown: 'markdown',
    html: 'html',
    xml: 'html',
    css: 'css',
    docker: 'docker',
    dockerfile: 'docker',
  };

  constructor() {
    this.markedInstance = new Marked();
    this.configureRenderer();
  }

  private configureRenderer(): void {
    this.markedInstance.use({
      renderer: {
        code: ({ text, lang }) => {
          return this.renderTerminalCodeBlock(text, lang);
        },
        heading: ({ text, depth }) => {
          return this.renderTerminalHeading(text, depth);
        },
        blockquote: ({ text }) => {
          return this.renderTerminalBlockquote(text);
        },
        hr: () => {
          return `<hr class="terminal-hr" />`;
        },
      },
    });
  }

  /**
   * Extrae el bloque Frontmatter YAML inicial y devuelve los metadatos estructurados
   * junto al cuerpo de Markdown limpio.
   */
  extractFrontmatter(markdown: string): ExtractedMarkdown {
    if (!markdown) {
      return { meta: null, content: '' };
    }

    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!match) {
      return { meta: null, content: markdown };
    }

    const rawYaml = match[1];
    const content = markdown.substring(match[0].length);
    const meta = this.parseYamlLines(rawYaml);

    return { meta, content };
  }

  /**
   * Transforma el cuerpo de Markdown en HTML semántico compatible con la hoja de estilos global.
   */
  render(markdown: string): string {
    if (!markdown) return '';
    return this.markedInstance.parse(markdown) as string;
  }

  private parseYamlLines(yaml: string): FrontmatterMeta {
    const lines = yaml.split('\n');
    const meta: FrontmatterMeta = { otros: [], tags: [] };
    let currentKey: string | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('- ') && currentKey) {
        const val = line.replace(/^[-\s"'[\]]+|["'[\]]+$/g, '').trim();
        const lowerKey = currentKey.toLowerCase();
        if (lowerKey === 'tags') {
          meta.tags.push(val);
        } else if (lowerKey === 'canal' && !meta.canal) {
          meta.canal = val;
        } else if ((lowerKey === 'título' || lowerKey === 'titulo') && !meta.titulo) {
          meta.titulo = val;
        } else {
          meta.otros.push({ key: currentKey, val });
        }
        continue;
      }

      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.substring(0, colonIdx).trim();
        const rawVal = line.substring(colonIdx + 1).trim();
        const val = rawVal.replace(/^["'[\]]+|["'[\]]+$/g, '').trim();
        currentKey = key;
        if (val) {
          if (key.toLowerCase() === 'fecha') meta.fecha = val;
          else if (key.toLowerCase() === 'canal') meta.canal = val;
          else if (key.toLowerCase() === 'título' || key.toLowerCase() === 'titulo') meta.titulo = val;
          else meta.otros.push({ key, val });
        }
      }
    }
    return meta;
  }

  private renderTerminalHeading(text: string, depth: number): string {
    if (depth === 1) {
      return `
<div class="terminal-heading-1">
  <h1>${text}</h1>
</div>`.trim();
    }

    if (depth === 2) {
      return `
<div class="terminal-heading-2">
  <h2>
    <span class="terminal-code-lines">──</span>
    <span>${text}</span>
  </h2>
</div>`.trim();
    }

    if (depth === 3) {
      return `
<div class="terminal-heading-3">
  <h3>
    <span class="terminal-code-lines">►</span>
    <span>${text}</span>
  </h3>
</div>`.trim();
    }

    return `<h${depth} class="terminal-heading">${text}</h${depth}>`;
  }

  private renderTerminalBlockquote(text: string): string {
    const calloutMatch = text.match(/^\s*(?:<p>)?\s*\[!([a-zA-Z0-9_-]+)\][ \t]*(.*?)(?:<\/p>|\n|$)([\s\S]*)$/);
    if (calloutMatch) {
      const type = calloutMatch[1].toUpperCase();
      const title = calloutMatch[2].trim();
      let body = (calloutMatch[3] || '').trim();

      if (body.endsWith('</p>') && !body.includes('<p>')) {
        body = body.substring(0, body.length - 4).trim();
      }
      if (body && !body.startsWith('<p>')) {
        body = `<p>${body.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      }

      const displayTitle = title || type;

      return `
<div class="terminal-callout terminal-callout-${type.toLowerCase()}">
  <div class="terminal-callout-header">
    <span>✦</span>
    <span>[ ${this.escapeHtml(type)}${title ? ' :: ' + this.escapeHtml(displayTitle) : ''} ]</span>
  </div>
  <div class="terminal-callout-body">
    ${body}
  </div>
</div>`.trim();
    }

    return `
<blockquote class="terminal-blockquote">
  ${text}
</blockquote>`.trim();
  }

  private renderTerminalCodeBlock(codeText: string, rawLang?: string): string {
    const rawClean = (rawLang || '').trim().toLowerCase().split(/\s+/)[0];
    const normalizedLang = this.languageMap[rawClean] || rawClean || 'text';
    const lines = codeText.split('\n');
    const lineCount = lines.length;

    let highlightedHtml: string;
    const grammar = Prism.languages[normalizedLang];
    if (grammar) {
      try {
        highlightedHtml = Prism.highlight(codeText, grammar, normalizedLang);
      } catch {
        highlightedHtml = this.escapeHtml(codeText);
      }
    } else {
      highlightedHtml = this.escapeHtml(codeText);
    }

    const lineRows = '<span></span>'.repeat(lineCount);
    const encodedCode = encodeURIComponent(codeText);
    const lineLabel = lineCount === 1 ? '1 LÍNEA' : `${lineCount} LÍNEAS`;
    const langDisplay = (rawClean || 'CODE').toUpperCase();

    return `
<figure class="terminal-code-block">
  <div class="terminal-code-header">
    <div class="terminal-code-meta">
      <span>──</span>
      <span class="terminal-code-lang">[ ${this.escapeHtml(langDisplay)} ]</span>
      <span class="terminal-code-lines">[ ${lineLabel} ]</span>
    </div>
    <button
      type="button"
      class="code-copy-btn"
      data-code="${encodedCode}"
      title="Copiar bloque de código"
    >
      [ COPIAR ]
    </button>
  </div>
  <div class="terminal-code-content">
    <pre class="terminal-pre line-numbers"><code class="language-${this.escapeHtml(normalizedLang)}">${highlightedHtml}</code><span aria-hidden="true" class="line-numbers-rows">${lineRows}</span></pre>
  </div>
  <div class="terminal-code-footer">
    <span class="terminal-code-rule">────────────────────────────────────────────────────────────────────────────────────────────────────</span>
  </div>
</figure>`.trim();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
