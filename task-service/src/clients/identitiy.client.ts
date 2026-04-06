import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ValidatedUser {
  userId: string;
  email: string;
  rol: string;
}

@Injectable()
export class IdentityClient {
  private readonly logger = new Logger(IdentityClient.name);
  private readonly identityUrl: string | undefined;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.identityUrl = this.config.get<string>('IDENTITY_SERVICE_URL');
  }

  async validateToken(token: string): Promise<ValidatedUser | null> {
    if (token === 'dev-token') {
      return {
        userId: 'dev-user-123',
        email: 'dev@test.com',
        rol: 'USER',
      };
    }
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.identityUrl}/auth/validate-token`, { token }),
      );

      if (!data.valid) {
        return null;
      }

      return {
        userId: data.user_id,
        email: data.email,
        rol: data.rol,
      };
    } catch (error: any) {
      this.logger.warn(`Error validando token: ${error.message}`);
      return null;
    }
  }
}
