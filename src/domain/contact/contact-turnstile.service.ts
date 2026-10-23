import { BadRequestException, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

type TurnstileVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

@Injectable()
export class ContactTurnstileService {
  constructor(private readonly appConfig: AppConfigService) {}

  get isEnabled(): boolean {
    return this.appConfig.isTurnstileEnabled;
  }

  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    if (!this.appConfig.isTurnstileEnabled) {
      return;
    }
    const secret = this.appConfig.turnstileSecretKey;
    if (!secret) {
      return;
    }
    if (!token?.trim()) {
      throw new BadRequestException('Verification required');
    }

    const body = new URLSearchParams({
      secret,
      response: token.trim(),
    });
    if (remoteIp?.trim()) {
      body.set('remoteip', remoteIp.trim());
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );

    if (!response.ok) {
      throw new BadRequestException('Verification failed');
    }

    const data = (await response.json()) as TurnstileVerifyResponse;
    if (!data.success) {
      throw new BadRequestException('Verification failed');
    }
  }
}
