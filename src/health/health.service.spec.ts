import { getDrizzleToken } from '@nestjs/drizzle';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let healthService: HealthService;
  let execute: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    execute = vi.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getDrizzleToken(),
          useValue: { execute },
        },
      ],
    }).compile();

    healthService = module.get(HealthService);
  });

  it('reports database up when SELECT 1 succeeds', async () => {
    execute.mockResolvedValue(undefined);
    await expect(healthService.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('reports database down when query fails', async () => {
    execute.mockRejectedValue(new Error('connection refused'));
    await expect(healthService.check()).resolves.toEqual({
      status: 'ok',
      database: 'down',
    });
  });
});
