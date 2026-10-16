import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../../health/health.service';
import { PublicHealthController } from './public-health.controller';

describe('PublicHealthController', () => {
  let controller: PublicHealthController;
  let check: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    check = vi.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicHealthController],
      providers: [
        {
          provide: HealthService,
          useValue: { check },
        },
      ],
    }).compile();

    controller = module.get(PublicHealthController);
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
