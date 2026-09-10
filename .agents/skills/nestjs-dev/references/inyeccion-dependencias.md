# Inyección de Dependencias y Scopes en NestJS

NestJS cuenta con un contenedor IoC (Inversion of Control) robusto. Entender los ciclos de vida y patrones de inyección previene fugas de memoria y asegura testabilidad.

## 1. Preferir Constructor Injection

Siempre inyectar dependencias a través del constructor marcándolas como `private readonly`.

```ts
@Injectable()
export class SummariesService {
  constructor(
    private readonly summariesRepository: SummariesRepository,
    private readonly configService: ConfigService,
  ) {}
}
```

- ❌ Evitar inyección por propiedades (`@Inject()`) salvo casos específicos como tokens abstractos.
- ❌ Nunca instanciar dependencias manualmente con `new` dentro de una clase inyectable.

## 2. Conciencia de Scopes (Scope Awareness)

Por defecto, todos los providers en NestJS son **Singletons** (`Scope.DEFAULT`).

| Scope | Ciclo de Vida | Impacto en Rendimiento | Cuándo Usarlo |
|---|---|---|---|
| **DEFAULT (Singleton)** | Se instancia una sola vez al arrancar | 🟢 Óptimo (Cero overhead) | 99% de los casos |
| **REQUEST** | Una instancia nueva por cada petición HTTP | 🔴 Muy pesado (destruye rendimiento) | Multitenancy estricto por subdominio o request context |
| **TRANSIENT** | Una instancia nueva por cada clase que lo inyecte | 🟡 Medio | Clientes o generadores con estado volátil |

> ⚠️ **Regla de Oro:** Si un servicio es `REQUEST`, cualquier servicio o controlador que lo inyecte se convierte automáticamente en `REQUEST` en cascada. Mantener todo en Singleton.

## 3. Uso de Tokens de Inyección para Abstracciones

TypeScript elimina las interfaces durante la transpilación a JavaScript. Para inyectar abstracciones o contratos desacoplados, se deben usar tokens de inyección:

```ts
// Contrato
export interface INotificationService {
  send(message: string): Promise<void>;
}

export const NOTIFICATION_SERVICE = Symbol('NOTIFICATION_SERVICE');

// Registro en el Módulo
@Module({
  providers: [
    {
      provide: NOTIFICATION_SERVICE,
      useClass: TelegramNotificationService,
    },
  ],
  exports: [NOTIFICATION_SERVICE],
})
export class NotificationModule {}

// Inyección en el consumidor
@Injectable()
export class AlertService {
  constructor(
    @Inject(NOTIFICATION_SERVICE)
    private readonly notifier: INotificationService,
  ) {}
}
```

## 4. Evitar el Anti-patrón Service Locator

No inyectar `ModuleRef` para resolver dependencias dinámicamente (`this.moduleRef.get(...)`) dentro de los métodos de negocio. Esto oculta las dependencias reales de la clase y complica los tests unitarios.
