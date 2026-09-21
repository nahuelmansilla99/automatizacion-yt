import { TestBed } from '@angular/core/testing';
import { MarkdownRendererService } from './markdown-renderer.service';

describe('MarkdownRendererService', () => {
  let service: MarkdownRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarkdownRendererService],
    });
    service = TestBed.inject(MarkdownRendererService);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('extractFrontmatter', () => {
    it('debería retornar meta nulo y content vacío si el input es nulo o vacío', () => {
      expect(service.extractFrontmatter('')).toEqual({ meta: null, content: '' });
      expect(service.extractFrontmatter(null as unknown as string)).toEqual({ meta: null, content: '' });
    });

    it('debería retornar meta nulo y el contenido intacto si no hay frontmatter', () => {
      const md = '# Solo un título\nTexto explicativo.';
      const res = service.extractFrontmatter(md);
      expect(res.meta).toBeNull();
      expect(res.content).toBe(md);
    });

    it('debería extraer metadatos estructurados de YAML (fecha, canal, tags) separándolos del contenido', () => {
      const md = `---
Relación:
- "[Ejemplo]"
Fecha: 2026-09-20
tags:
  - "#ia"
  - "#productividad"
Canal:
  - "[[Midudev]]"
Título: "Guía de IA"
---

# Contenido del Resumen`;

      const res = service.extractFrontmatter(md);
      expect(res.meta).not.toBeNull();
      expect(res.meta?.fecha).toBe('2026-09-20');
      expect(res.meta?.canal).toBe('Midudev');
      expect(res.meta?.tags).toEqual(['#ia', '#productividad']);
      expect(res.content.trim()).toBe('# Contenido del Resumen');
    });
  });

  describe('render', () => {
    it('debería retornar string vacío si el contenido es nulo o vacío', () => {
      expect(service.render('')).toBe('');
      expect(service.render(null as unknown as string)).toBe('');
    });

    it('debería renderizar encabezados y markdown estándar con clases semánticas', () => {
      const md = '# Título Principal\n\nEste es un texto con **negrita** y *cursiva*.';
      const html = service.render(md);

      expect(html).toContain('terminal-heading-1');
      expect(html).toContain('Título Principal');
      expect(html).toContain('<strong>negrita</strong>');
      expect(html).toContain('<em>cursiva</em>');
    });

    it('debería renderizar un bloque de código con clases semánticas, metadata y botón copiar', () => {
      const md = '```typescript\nconst total: number = 100;\n```';
      const html = service.render(md);

      expect(html).toContain('terminal-code-block');
      expect(html).toContain('[ TYPESCRIPT ]');
      expect(html).toContain('[ 1 LÍNEA ]');
      expect(html).toContain('code-copy-btn');
      expect(html).toContain('data-code="const%20total%3A%20number%20%3D%20100%3B"');
      expect(html).toContain('line-numbers-rows');
      // Tokens de Prism
      expect(html).toContain('token keyword');
      expect(html).toContain('token builtin');
    });

    it('debería contar las líneas correctamente en bloques multi-línea', () => {
      const md = '```python\ndef saludo():\n    print("hola")\n    return True\n```';
      const html = service.render(md);

      expect(html).toContain('[ 3 LÍNEAS ]');
      expect(html).toContain('[ PYTHON ]');
      expect(html).toContain('token function');
      expect(html).toContain('token string');
    });

    it('debería manejar lenguajes desconocidos con escape HTML seguro', () => {
      const md = '```unknownlang\n<script>alert("xss")</script>\n```';
      const html = service.render(md);

      expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(html).not.toContain('<script>alert');
      expect(html).toContain('[ UNKNOWNLANG ]');
    });

    it('debería soportar alias como sh, js, ts, yml', () => {
      const md = '```sh\necho "test"\n```';
      const html = service.render(md);

      expect(html).toContain('language-bash');
      expect(html).toContain('token string');
    });

    it('debería transformar callouts de Obsidian ([!abstract]) en tarjetas semánticas terminales', () => {
      const md = `> [!abstract] Resumen Ejecutivo
> Esta es la tesis central del video sobre automatizaciones.`;

      const html = service.render(md);

      expect(html).toContain('terminal-callout');
      expect(html).toContain('terminal-callout-abstract');
      expect(html).toContain('[ ABSTRACT :: Resumen Ejecutivo ]');
      expect(html).toContain('Esta es la tesis central');
    });

    it('debería dar formato a encabezados H2 y H3 con clases semánticas terminales', () => {
      const md = `## 💡 Ideas Centrales
### Detalle de Implementación`;

      const html = service.render(md);

      expect(html).toContain('terminal-heading-2');
      expect(html).toContain('💡 Ideas Centrales');
      expect(html).toContain('terminal-heading-3');
      expect(html).toContain('Detalle de Implementación');
    });
  });
});
