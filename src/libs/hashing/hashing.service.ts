import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

@Injectable()
export class HashingService {
  async hashPassword(password: string): Promise<string> {
    return hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async verifyPassword(password: string, phc: string): Promise<boolean> {
    return verify(phc, password);
  }

  async hashOtp(otp: string): Promise<string> {
    return this.hashPassword(otp);
  }

  async verifyOtp(otp: string, phc: string): Promise<boolean> {
    return this.verifyPassword(otp, phc);
  }
}
