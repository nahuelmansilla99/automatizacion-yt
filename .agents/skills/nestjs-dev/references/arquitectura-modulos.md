# Arquitectura y Organización de Módulos en NestJS

La arquitectura modular es el pilar de escalabilidad y mantenibilidad en NestJS. Una mala estructura modular produce dependencias circulares y servicios acoplados difíciles de testear.

## 1. Organización por Feature Modules (Obligatorio)

Organizar el código alrededor de dominios de negocio (Features), NUNCA por capas técnicas globales (`controllers/`, `services/`).

```
src/
├── core/                  # Módulos globales: config, logger, database, auth
├── shared/                # Utilidades, decorators e interfaces compartidas
├── features/              # Dominios de negocio
│   ├── summaries/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── summaries.controller.ts
│   │   ├── summaries.service.ts
│   │   └── summaries.module.ts
│   └── webhooks/
│       ├── webhooks.controller.ts
│       ├── webhooks.service.ts
│       └── webhooks.module.ts
├── app.module.ts
└── main.ts
```

## 2. Evitar Dependencias Circulares (Causa #1 de Crashes)

Una dependencia circular ocurre cuando el Módulo A importa al B y el Módulo B importa al A.
Aunque NestJS provee `forwardRef()`, su uso indica problemas de diseño y debe evitarse.

### ❌ Anti-patrón:
```ts
// users.module.ts
@Module({
  imports: [forwardRef(() => OrdersModule)],
})
export class UsersModule {}

// orders.module.ts
@Module({
  imports: [forwardRef(() => UsersModule)],
})
export class OrdersModule {}
```

### ✅ Solución 1: Extraer a un módulo común
Si ambos necesitan una funcionalidad compartida, extraerla a un tercer módulo (ej. `AccountsModule` o `SharedModule`).

### ✅ Solución 2: Desacoplar mediante Eventos
Usar `@nestjs/event-emitter` para comunicación asíncrona no bloqueante:
```ts
// En summaries.service.ts
@Injectable()
export class SummariesService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async markAsSuccess(id: string, markdown: string) {
    await this.repo.update(id, { status: 'SUCCESS', markdownContent: markdown });
    this.eventEmitter.emit('summary.completed', { id });
  }
}
```

## 3. Principio de Responsabilidad Única (Single Responsibility)

Evitar "God Services" que manejan persistencia, llamadas externas, validación y lógica de negocio a la vez.

- **Controller**: Solo recibe la petición HTTP, valida DTO y delega.
- **Service de Negocio**: Orquesta las reglas de la aplicación.
- **Service de Integración Externa**: Encapsula APIs de terceros (ej. `SupadataClientService`, `GeminiClientService`).
- **Repository**: Maneja exclusivamente consultas y persistencia.

## 4. Compartir Módulos Correctamente

- Solo exportar lo estrictamente necesario en el array `exports`.
- No registrar un provider en múltiples módulos si ya se exporta desde otro.
- Usar `@Global()` con extremo cuidado: solo para módulos verdaderamente universales (ej. Config, Database).
