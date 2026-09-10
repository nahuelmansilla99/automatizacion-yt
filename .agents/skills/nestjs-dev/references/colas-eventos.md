# Colas de Trabajo (BullMQ), Eventos y WebSockets

Para tareas pesadas o asíncronas que superan 1 segundo (ej. extracción, transcripción, LLMs, scraping), la API HTTP debe responder de inmediato y delegar el procesamiento.

## 1. Flujo Asíncrono con Webhooks o Colas

En este proyecto (Automatización Resumen YT):
1. Angular envía URL a NestJS.
2. NestJS crea registro con estado `PENDING` y despacha el trabajo (disparando el webhook de n8n o enviando a cola BullMQ).
3. NestJS responde **202 Accepted** de inmediato.
4. El proceso pesado ocurre en segundo plano.

## 2. Colas en Segundo Plano con BullMQ

Cuando el procesamiento se gestiona internamente:

```ts
// Productor: summaries.service.ts
@Injectable()
export class SummariesService {
  constructor(@InjectQueue('transcriptions') private readonly queue: Queue) {}

  async requestSummary(dto: CreateSummaryDto) {
    const job = await this.queue.add('process-video', { url: dto.youtubeUrl });
    return { jobId: job.id, status: 'QUEUED' };
  }
}

// Consumidor: summaries.processor.ts
@Processor('transcriptions')
export class SummariesProcessor extends WorkerHost {
  async process(job: Job<{ url: string }>) {
    // Proceso largo de extracción y llamada a IA
  }
}
```

## 3. Notificaciones en Tiempo Real (WebSockets / SSE)

Cuando n8n o la cola termina el procesamiento, notificar al frontend Angular instantáneamente:

```ts
// summaries.gateway.ts
@WebSocketGateway({ cors: { origin: '*' } })
export class SummariesGateway {
  @WebSocketServer()
  server: Server;

  notifyStatusChange(summaryId: string, status: string, error?: string) {
    this.server.emit(`summary:${summaryId}`, { status, error });
    this.server.emit('summary:updated', { summaryId, status });
  }
}
```
