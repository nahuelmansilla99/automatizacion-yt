# DTOs, Validación y Serialización

La validación y serialización de datos son la primera línea de defensa de la API. Ningún dato no tipado ni no validado debe entrar a los servicios.

## 1. Configuración Global de ValidationPipe

En `main.ts`, configurar el pipe global con reglas estrictas:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Elimina campos no declarados en el DTO
    forbidNonWhitelisted: true,   // Devuelve 400 si envían propiedades no permitidas
    transform: true,              // Convierte payloads automáticamente a instancias de sus DTOs
    transformOptions: {
      enableImplicitConversion: false, // Forzar tipos explícitos (@Type())
    },
  }),
);
```

## 2. Definición de DTOs con class-validator

Usar decoradores de `class-validator` y `class-transformer` de forma estricta:

```ts
import { IsUrl, IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateSummaryDto {
  @IsUrl({ protocols: ['https'], require_protocol: true }, {
    message: 'La URL debe ser un enlace HTTPS válido de YouTube',
  })
  @IsNotEmpty({ message: 'La URL es requerida' })
  readonly youtubeUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly tags?: string;
}
```

## 3. Pipes de Transformación y Casteo en Rutas

Para parámetros de ruta (`:id`, `:status`), usar los pipes nativos de NestJS:

```ts
@Get(':id')
async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
  return this.summariesService.findOne(id);
}
```

Pipes recomendados: `ParseUUIDPipe`, `ParseIntPipe`, `ParseBoolPipe`, `ParseEnumPipe`.

## 4. Serialización de Salida y Protección de Datos Sensibles

Para nunca filtrar contraseñas, secretos o campos internos:

1. Registrar `ClassSerializerInterceptor` globalmente o a nivel de controlador:
```ts
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

2. Excluir propiedades en las entidades o Response DTOs:
```ts
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  id: string;
  email: string;

  @Exclude() // Jamás viajará en el JSON de respuesta
  passwordHash: string;

  @Expose()
  get isVerified(): boolean {
    return true;
  }
}
```
