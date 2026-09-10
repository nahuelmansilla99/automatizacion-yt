# Seguridad, Autenticación (JWT) y Guards

La seguridad en NestJS debe ser declarativa, modular y basada en Guards e Interceptors probados.

## 1. Autenticación Stateless con JWT

Utilizar `@nestjs/passport` y `passport-jwt` para autenticación con tokens:

```ts
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Retorna los datos que se adjuntarán a req.user
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

## 2. Guards Declarativos y Metadata

Proteger endpoints mediante Guards funcionales o basados en clases:

```ts
@Controller('summaries')
@UseGuards(JwtAuthGuard)
export class SummariesController {
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.summariesService.findByUser(user.userId);
  }
}
```

### Decorator Personalizado `@CurrentUser()`
```ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

## 3. Endpoints Públicos mediante Decorator `@Public()`

En vez de aplicar `JwtAuthGuard` en cada controlador, se puede registrar como Guard global y excluir rutas con `@Public()`:

```ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

## 4. Rate Limiting con `@nestjs/throttler`

Proteger la API contra abusos, ataques DDoS y saturación de APIs externas (como cuotas de Supadata/Gemini):

```ts
// app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60000, // 60 segundos
  limit: 20,   // máximo 20 peticiones por ventana
}]),

// En main.ts o como provider global:
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard,
}
```
