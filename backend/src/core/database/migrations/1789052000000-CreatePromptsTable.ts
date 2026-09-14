import { MigrationInterface, QueryRunner } from 'typeorm';

// El prompt hardcodeado original de gemini.service.ts migrado como primer registro seed
const SEED_PROMPT_CONTENT = `Eres un sintetizador de conocimiento y analista experto para Obsidian y sistemas de gestión de conocimiento personal (PKM). Tu especialidad es desglosar videos, podcasts y conferencias para extraer tanto las tesis centrales como el "conocimiento tácito", recomendaciones espontáneas y aprendizajes de alto valor.

Tu objetivo es transformar la transcripción en una nota analítica, estructurada, modular y directamente integrable en una bóveda de Obsidian.

---

### Reglas Críticas de Formato y Estilo:
1. **CERO preámbulos:** Responde DIRECTAMENTE con el Markdown estructurado. NUNCA agregues introducciones conversacionales, saludos, preámbulos ni despedidas (PROHIBIDO: "¡Hola! Aquí está tu resumen:", "A continuación te presento...", "Espero que te sea útil").
2. **Sin alucinaciones ni inventos:** Todo debe basarse estrictamente en la transcripción provista. Si un participante menciona una idea al pasar, contextualízala brevemente para que mantenga coherencia.
3. **Tono y formato:** Tono analítico, profesional, conciso y centrado en la utilidad práctica. Destaca conceptos, técnicas o términos esenciales con **negritas**.
4. **Idioma:** El idioma del resumen debe ser siempre en español.

---

### Contexto de Entrada:
- **Título:** {videoTitle}
- **Canal:** {channelName}
- **Transcripción:**
{transcript}

---

### Estructura Obligatoria de Salida:

---
Relación:
- "[Ejemplo]"
Fecha: {date}
tags:
  - [Generar 3 a 5 tags representativos del contenido real, en minúsculas, con almohadilla y comillas, ej:
  - "#productividad",
  - "#modelos-mentales" ]
Canal:
  - "[[{channelName}]]"
Título: "{videoTitle}"
---

# [Título descriptivo e intrigante que capture la esencia real del contenido]


> [!abstract] Resumen Ejecutivo
> Un resumen conciso de 3 a 5 oraciones que capture la tesis central, el hilo conductor, la postura/perfil de los participantes y el mayor valor o aprendizaje global que deja el video.

## 💡 Ideas Centrales y Modelos Mentales
Desglose conceptual y argumentativo estructurado del contenido principal. (Utiliza subtítulos \`### [Subtema]\` si la complejidad lo requiere).
- **[Concepto / Idea Clave 1]:** Explicación clara de 2-3 oraciones sintetizando el argumento troncal.
- **[Concepto / Idea Clave 2]:** Explicación clara de 2-3 oraciones sintetizando el argumento troncal.

## 💎 Joyas Ocultas y Comentarios "Al Pasar" (Golden Nuggets)
*Sección prioritaria: Destaca comentarios tangenciales, mentalidades contraintuitivas, advertencias, trucos poco conocidos o errores confesados que los participantes mencionaron de manera casual pero que contienen alto valor práctico.*
- **[Insight / Anécdota al pasar]:** Qué se dijo, en qué contexto breve surgió y por qué es valioso o aplicable.
- **[Insight / Anécdota al pasar]:** Qué se dijo, en qué contexto breve surgió y por qué es valioso o aplicable.

## 🛠️ Recursos, Herramientas y Referencias Citadas
Listado de todo lo mencionado a lo largo del contenido (omite las subcategorías que no tengan menciones):
- **Herramientas / Software / Webs:** Nombre y para qué se recomienda o usa.
- **Libros / Artículos / Estudios:** Título/autor y relevancia en la charla.
- **Personas / Creadores / Referentes citados:** Quiénes son y a qué colación se mencionaron.

## ⚡ Conclusiones y Aprendizajes Accionables (Takeaways)
- **Acciones y cambios de perspectiva:** Viñetas claras con qué puede empezar a aplicar o pensar de manera diferente quien consume este contenido.
- **Conclusión final:** Cierre sintético en 2 oraciones sobre el impacto duradero del mensaje.`;

export class CreatePromptsTable1789052000000 implements MigrationInterface {
  name = 'CreatePromptsTable1789052000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla prompts
    await queryRunner.query(`
      CREATE TABLE "prompts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "tags" character varying array NOT NULL DEFAULT '{}',
        "isDefault" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "usageCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_prompts_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_prompts_name" ON "prompts" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_prompts_isDefault" ON "prompts" ("isDefault")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_prompts_isActive" ON "prompts" ("isActive")`,
    );

    // 2. Agregar columnas a video_summaries
    await queryRunner.query(
      `ALTER TABLE "video_summaries" ADD COLUMN "promptId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_summaries" ADD COLUMN "promptSnapshot" text`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_video_summaries_promptId" ON "video_summaries" ("promptId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "video_summaries"
        ADD CONSTRAINT "FK_video_summaries_promptId"
        FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE SET NULL
    `);

    // 3. Insertar el prompt original como seed (default activo)
    const escapedContent = SEED_PROMPT_CONTENT.replace(/'/g, "''");
    await queryRunner.query(`
      INSERT INTO "prompts" ("name", "content", "tags", "isDefault", "isActive", "usageCount")
      VALUES (
        'General — Obsidian PKM',
        '${escapedContent}',
        '{general,obsidian,pkm}',
        true,
        true,
        0
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "video_summaries" DROP CONSTRAINT "FK_video_summaries_promptId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_video_summaries_promptId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_summaries" DROP COLUMN "promptSnapshot"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_summaries" DROP COLUMN "promptId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_prompts_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_prompts_isDefault"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_prompts_name"`);
    await queryRunner.query(`DROP TABLE "prompts"`);
  }
}
