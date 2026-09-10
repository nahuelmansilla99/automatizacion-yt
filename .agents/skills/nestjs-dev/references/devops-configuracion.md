# DevOps, Variables de Entorno y Despliegue (Docker & Dokploy)

Garantizar arranques limpios, apagados ordenados y configuración validada es esencial para despliegues con Docker y Dokploy.

## 1. Validación Estricta de Variables de Entorno con Joi o Zod

La aplicación **NUNCA debe iniciar** si falta una variable de entorno requerida (ej. `DATABASE_URL`, `JWT_SECRET`).

```ts
// app.module.ts
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        N8N_WEBHOOK_URL: Joi.string().uri().required(),
      }),
    }),
  ],
})
export class AppModule {}
```

## 2. Graceful Shutdown (Apagado Ordenado)

Al desplegar nuevas versiones en Dokploy / Docker, el contenedor recibe señales `SIGTERM`. Si no se activan los shutdown hooks, se cortan transacciones activas y requests en curso.

En `main.ts`:
```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // OBLIGATORIO: Permite que NestJS cierre conexiones a PostgreSQL y WebSockets limpiamente
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

En los servicios que manejen conexiones persistentes:
```ts
@Injectable()
export class WebSocketGatewayService implements OnModuleDestroy {
  onModuleDestroy() {
    this.server.close();
  }
}
```

## 3. Logging Estructurado

Evitar `console.log`. Usar el `Logger` nativo de NestJS o Winston/Pino en formato JSON para visualización en Dokploy logs:

```ts
private readonly logger = new Logger(SummariesService.name);

this.logger.log(`Procesando resumen para URL: ${url}`);
this.logger.warn(`Límite de reintentos alcanzado para ID: ${id}`);
this.logger.error(`Fallo en webhook de n8n: ${err.message}`, err.stack);
```
