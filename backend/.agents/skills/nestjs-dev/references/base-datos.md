# Base de Datos, Transacciones y Migraciones

La integridad y el rendimiento de la base de datos (PostgreSQL) son críticos para evitar deuda técnica y pérdidas de datos.

## 1. Cero `synchronize: true` en Producción (Usar Migraciones)

En TypeORM/Prisma, **`synchronize: true` está prohibido en producción**. Puede borrar columnas o tablas enteras en deployments.

- Generar migraciones controladas en el código:
```bash
npm run typeorm migration:generate -- -n CreateVideoSummariesTable
npm run typeorm migration:run
```

## 2. Transacciones para Operaciones Multi-Paso

Cuando una operación modifica varias tablas o realiza pasos dependientes, debe ejecutarse dentro de una transacción atómica:

```ts
// Con TypeORM DataSource
async processSummarySuccess(id: string, markdown: string, usage: number) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Actualizar estado del video
    await queryRunner.manager.update(VideoSummary, id, {
      markdownContent: markdown,
      status: 'SUCCESS',
    });

    // 2. Descontar o registrar uso de cuota
    await queryRunner.manager.increment(ApiUsage, { month: currentMonth }, 'consumedTokens', usage);

    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw new InternalServerErrorException('Error al confirmar resumen en base de datos');
  } finally {
    await queryRunner.release();
  }
}
```

## 3. Prevenir Problemas de Consulta N+1

Cargar relaciones de forma explícita mediante joins en vez de ejecutar queries en loops:

```ts
// ❌ Anti-patrón: 1 query para obtener resúmenes + N queries para cada canal
for (const s of summaries) {
  s.channel = await this.channelRepo.findOne(s.channelId);
}

// ✅ Correcto: 1 sola query con JOIN
return this.summariesRepo.find({
  relations: ['channel'],
  select: {
    id: true,
    videoTitle: true,
    status: true,
  },
});
```

## 4. Índices en Columnas Clave

Siempre indexar columnas utilizadas en `WHERE`, `ORDER BY` y claves foráneas:
- Índices en `status` (para filtrar listas rápidamente).
- Índices en `youtubeUrl` o `createdAt`.
