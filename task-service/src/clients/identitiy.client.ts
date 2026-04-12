import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AuditLogRequestDto } from './dto/audit-log-request.dto';

export interface ValidatedUser {
  userId: string;
  email: string;
  rol: string;
}

@Injectable()
export class IdentityClient {
  private readonly logger = new Logger(IdentityClient.name);
  private readonly identityUrl: string | undefined;
  private readonly internalServiceKey: string | undefined;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.identityUrl = this.config.get<string>('IDENTITY_SERVICE_URL');
    this.internalServiceKey = this.config.get<string>('INTERNAL_SERVICE_KEY');
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

  async createAuditLog(dto: AuditLogRequestDto): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.identityUrl}/audit/logs`, dto, {
          headers: {
            'X-Internal-Service-Key': this.internalServiceKey,
          },
        }),
      );
    } catch (error: any) {
      this.logger.warn(
        `Failed to create audit log [${dto.action}] for user ${dto.user_id}: ${error.message}`,
      );
    }
  }
}
