---
name: nestjs-dev
description: >-
  Skill principal de desarrollo backend con NestJS. Activar cuando se trabaje con
  módulos, controladores, servicios, inyección de dependencias, DTOs y validación,
  autenticación (JWT), guards, exception filters, bases de datos (PostgreSQL/TypeORM/Prisma),
  transacciones, testing (unitario y E2E), WebSockets, colas (BullMQ) o despliegue
  con Docker/Dokploy. Proporciona patrones de arquitectura limpia, código escalable y
  cero deuda técnica.
---

# Guía de Desarrollo Backend NestJS

Esta skill define las mejores prácticas de arquitectura, seguridad, mantenibilidad y rendimiento para el backend en NestJS, optimizada para equipos y asistentes IA.

## Reglas Obligatorias de Oro

1. **Organización por Feature Modules**: Cada dominio de negocio tiene su propio módulo. Prohibido agrupar por capas técnicas globales.
2. **Evitar Dependencias Circulares**: Causa #1 de caídas en NestJS. Si dos módulos se necesitan mutuamente, extraer lógica común a un tercer módulo o desacoplar vía eventos (`EventEmitter2`).
3. **Validación Estricta de Todo Payload**: Activar `ValidationPipe` con `whitelist: true` y `forbidNonWhitelisted: true`.
4. **Cero `synchronize: true` en Producción**: Usar siempre migraciones de base de datos versionadas.
5. **Providers en Singleton**: Mantener `Scope.DEFAULT` salvo casos de multitenancy estrictos.
6. **Validación de Variables de Entorno**: La aplicación no debe arrancar si faltan variables requeridas (`ConfigModule` con Joi/Zod).
7. **Graceful Shutdown**: Activar `app.enableShutdownHooks()` para despliegues con Docker/Dokploy.

---

## Cuándo Consultar Cada Referencia

Consultá la referencia técnica correspondiente según la tarea a ejecutar:

### 🏛️ Arquitectura & Módulos
Cuando se creen nuevos módulos, se organice la estructura de carpetas, o se resuelvan dependencias circulares:
→ Leer [arquitectura-modulos.md](references/arquitectura-modulos.md)

### 💉 Inyección de Dependencias & Scopes
Cuando se inyecten servicios con constructor injection, se manejen Injection Tokens, o se configure el ciclo de vida de providers:
→ Leer [inyeccion-dependencias.md](references/inyeccion-dependencias.md)

### 🛡️ DTOs, Validación & Serialización
Cuando se definan contratos de entrada/salida de la API, decorators de `class-validator`, pipes de casteo (`ParseUUIDPipe`), o exclusión de datos sensibles:
→ Leer [dtos-validacion.md](references/dtos-validacion.md)

### 🔐 Seguridad, Auth (JWT) & Guards
Cuando se implemente autenticación con tokens JWT, protección de endpoints mediante Guards, decorators `@CurrentUser()`, o Rate Limiting:
→ Leer [seguridad-auth.md](references/seguridad-auth.md)

### ⚠️ Manejo Centralizado de Errores
Cuando se configuren Exception Filters globales, excepciones semánticas HTTP (`NotFoundException`), o formato estándar de errores:
→ Leer [manejo-errores.md](references/manejo-errores.md)

### 🗄️ Base de Datos, Transacciones & Migraciones
Cuando se creen entidades, consultas sin problema N+1, transacciones atómicas con `QueryRunner`, o migraciones con PostgreSQL:
→ Leer [base-datos.md](references/base-datos.md)

### 🧪 Testing Automatizado
Cuando se escriban unit tests con `Test.createTestingModule`, mocks de repositorios y clientes de terceros, o pruebas E2E con Supertest:
→ Leer [testing.md](references/testing.md)

### 🐳 DevOps, ConfigModule & Dokploy
Cuando se configure el arranque con `ConfigModule` y Joi, graceful shutdown en Docker/Dokploy, y logging estructurado:
→ Leer [devops-configuracion.md](references/devops-configuracion.md)

### ⚡ Colas de Trabajo, Eventos & WebSockets
Cuando se procesen tareas pesadas asíncronas con BullMQ, comunicación por eventos o WebSockets/SSE para actualizaciones en tiempo real hacia Angular:
→ Leer [colas-eventos.md](references/colas-eventos.md)

---

## Estructura Recomendada del Proyecto NestJS

```
src/
├── core/                       # Módulos globales de infraestructura
│   ├── config/                 # Validación de variables de entorno
│   ├── database/               # Conexión TypeORM / Prisma y migraciones
│   ├── filters/                # AllExceptionsFilter
│   └── guards/                 # JwtAuthGuard, RolesGuard
│
├── shared/                     # Utilidades, decoradores y tipos comunes
│   ├── decorators/             # @CurrentUser(), @Public()
│   └── dto/                    # Paginación, respuestas comunes
│
├── features/                   # Dominios de negocio (Features)
│   ├── summaries/              # Dominio de resúmenes de videos
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── summaries.controller.ts
│   │   ├── summaries.service.ts
│   │   └── summaries.module.ts
│   │
│   ├── webhooks/               # Receptores de n8n (success / error)
│   │   ├── webhooks.controller.ts
│   │   ├── webhooks.service.ts
│   │   └── webhooks.module.ts
│   │
│   └── notifications/          # WebSockets / SSE hacia Angular
│       ├── notifications.gateway.ts
│       └── notifications.module.ts
│
├── app.module.ts
└── main.ts
```
