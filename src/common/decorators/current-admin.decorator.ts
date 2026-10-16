import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AdminPayload {
  sub: string;
  sessionId: string;
  role: 'admin';
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminPayload => {
    const request = ctx.switchToHttp().getRequest<{ admin: AdminPayload }>();
    return request.admin;
  },
);
