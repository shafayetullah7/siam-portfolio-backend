import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let check: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    check = vi.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: { check },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns health when database is up', async () => {
    check.mockResolvedValue({ status: 'ok', database: 'up' });
    await expect(controller.getHealth()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('throws when database is down', async () => {
    check.mockResolvedValue({ status: 'ok', database: 'down' });
    await expect(controller.getHealth()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
