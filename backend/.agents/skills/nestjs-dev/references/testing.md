# Testing Automatizado en NestJS

Una suite de tests sólida permite refactorizar sin miedo y garantiza cero deuda técnica en el backend.

## 1. Tests Unitarios con `Test.createTestingModule`

Los tests unitarios prueban servicios de forma aislada, mockeando repositorios y clientes externos:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { SummariesService } from './summaries.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VideoSummary } from './entities/video-summary.entity';

describe('SummariesService', () => {
  let service: SummariesService;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummariesService,
        {
          provide: getRepositoryToken(VideoSummary),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<SummariesService>(SummariesService);
  });

  it('debería retornar un resumen si existe', async () => {
    const summary = { id: 'uuid-1', videoTitle: 'Test' };
    mockRepo.findOne.mockResolvedValue(summary);

    const result = await service.findOne('uuid-1');
    expect(result).toEqual(summary);
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
  });

  it('debería lanzar NotFoundException si no existe', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne('uuid-invalid')).rejects.toThrow(NotFoundException);
  });
});
```

## 2. Mockear Clientes Externos (APIs de terceros, Webhooks)

Nunca conectar con APIs reales en tests unitarios ni E2E en CI:

```ts
const mockSupadataService = {
  getTranscript: jest.fn().mockResolvedValue('Transcripción simulada...'),
};
```

## 3. Tests E2E con Supertest

Prueban el pipeline HTTP completo (Guards, Interceptors, Controllers y DB):

```ts
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('SummariesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST /api/summaries (valid payload)', () => {
    return request(app.getHttpServer())
      .post('/api/summaries')
      .send({ youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
      .expect(202)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('PENDING');
      });
  });
});
```
