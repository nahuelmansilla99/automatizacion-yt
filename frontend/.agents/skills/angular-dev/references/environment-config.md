# Configuración por Ambiente

Angular soporta dos estrategias principales de configuración para manejar valores que cambian entre ambientes (desarrollo, staging, producción).

## Configuración Build-Time (Tiempo de Compilación)

Los archivos de environment definen valores que se reemplazan en tiempo de compilación.

### Generar archivos de environment

```bash
ng generate environments
```

Esto crea:

```ts
// environments/environment.ts (producción)
export const environment = {
  apiUrl: 'https://resumenes.ncodem.com/api',
  wsUrl: 'wss://resumenes.ncodem.com',
  production: true,
};
```

```ts
// environments/environment.development.ts
export const environment = {
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000',
  production: false,
};
```

### Usar en el código

```ts
import {environment} from '../environments/environment';

const apiUrl = environment.apiUrl;
```

El Angular CLI reemplaza el archivo apropiado según la configuración de build.

> ⚠️ **Seguridad**: Los archivos de environment se incluyen en el bundle del cliente. Son visibles para cualquier usuario que cargue la página. **Nunca guardar secrets, API keys, o credenciales** en archivos de environment. Esos valores van en el backend (NestJS).

### Verificar modo desarrollo

Usar `isDevMode()` de `@angular/core` en vez de flags manuales:

```ts
import {isDevMode} from '@angular/core';

if (isDevMode()) {
  console.log('Modo desarrollo activado');
}
```

## Configuración Runtime (Tiempo de Ejecución)

Para valores que necesitan cargarse dinámicamente al iniciar la app:

```ts
// En app.config.ts
import {APP_INITIALIZER} from '@angular/core';

function initializeApp(configService: ConfigService) {
  return () => configService.loadConfig();
}

export const appConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService],
      multi: true,
    },
  ],
};
```

## Angular CLI

Comandos esenciales:

| Comando | Qué hace |
|---------|----------|
| `ng new proyecto` | Crear nuevo proyecto |
| `ng generate component nombre` | Generar componente |
| `ng generate service nombre` | Generar servicio |
| `ng generate pipe nombre` | Generar pipe |
| `ng generate guard nombre` | Generar guard |
| `ng generate environments` | Generar archivos de environment |
| `ng serve` | Servidor de desarrollo |
| `ng build` | Build de producción |
| `ng test` | Ejecutar unit tests |
| `ng lint` | Ejecutar linter |

### Verificación Obligatoria

Después de generar código, **siempre ejecutar `ng build`** para verificar que no hay errores de compilación.

## Buenas Prácticas

1. **Usar `environment.apiUrl`** como base para todas las llamadas HTTP
2. **Nunca hardcodear URLs** de API en services o componentes
3. **`isDevMode()`** para lógica condicional de desarrollo
4. **Secrets en el backend**, nunca en el frontend
5. **Runtime config** para valores que cambian sin re-compilar
