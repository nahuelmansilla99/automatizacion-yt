# Manejo Centralizado de Errores y Exception Filters

Un manejo de errores profesional nunca filtra excepciones crudas de base de datos ni stack traces al cliente. Provee respuestas consistentes y logs estructurados.

## 1. Excepciones HTTP Estándar

Los servicios deben arrojar excepciones de `@nestjs/common` con códigos de estado semánticos:

```ts
if (!summary) {
  throw new NotFoundException(`El resumen con ID ${id} no existe`);
}

if (quotaExceeded) {
  throw new HttpException('Cuota de Supadata agotada para este mes', HttpStatus.TOO_MANY_REQUESTS);
}
```

## 2. Filtro Global de Excepciones (AllExceptionsFilter)

Captura todas las excepciones no controladas y devuelve un formato estándar para el frontend:

```ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Error interno del servidor';

    const errorMessage = typeof message === 'object' && 'message' in message
      ? (message as any).message
      : message;

    // Log estructurado del error
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(errorMessage)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorMessage,
    });
  }
}
```

## 3. Registro en `main.ts`

```ts
app.useGlobalFilters(new AllExceptionsFilter());
```
