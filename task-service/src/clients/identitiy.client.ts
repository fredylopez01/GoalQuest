import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AuditLogRequestDto } from './dto/audit-log-request.dto';
import { EurekaService } from 'src/eureka/eureka.service';

export interface ValidatedUser {
  userId: string;
  email: string;
  rol: string;
}

@Injectable()
export class IdentityClient {
  private readonly logger = new Logger(IdentityClient.name);
  private readonly internalServiceKey: string | undefined;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly eurekaService: EurekaService,
  ) {
    this.internalServiceKey = this.config.get<string>('INTERNAL_SERVICE_KEY');
  }

  // ============================================================
  // HELPER: Obtener URL de un servicio (Eureka con fallback)
  // ============================================================
  private getServiceUrl(serviceName: string, fallbackEnvKey: string): string {
    const eurekaUrl = this.eurekaService.getServiceUrl(serviceName);
    if (eurekaUrl) return eurekaUrl;

    const fallbackUrl = this.config.get<string>(fallbackEnvKey);
    if (!fallbackUrl) {
      throw new Error(
        `Service "${serviceName}" not found in Eureka and fallback env var "${fallbackEnvKey}" is not configured`,
      );
    }

    return fallbackUrl;
  }

  async validateToken(token: string): Promise<ValidatedUser | null> {
    // if (token === 'dev-token') {
    //   return {
    //     userId: 'dev-user-123',
    //     email: 'dev@test.com',
    //     rol: 'USER',
    //   };
    // }
    try {
      const identityUrl = this.getServiceUrl(
        'identity-service',
        'IDENTITY_SERVICE_URL',
      );
      console.log(identityUrl);

      const { data } = await firstValueFrom(
        this.http.post(
          `${identityUrl}/auth/validate-token`,
          { token },
          {
            headers: {
              'X-Internal-Service-Key': this.internalServiceKey,
            },
          },
        ),
      );
      console.log(data);

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
    // if (dto.user_id === 'dev-user-123') {
    //   this.logger.log(
    //     `Audit log [${dto.action}] for user ${dto.user_id}: ${dto.description} (IP: ${dto.ip_address})`,
    //   );
    //   return;
    // }
    try {
      const identityUrl = this.getServiceUrl(
        'identity-service',
        'IDENTITY_SERVICE_URL',
      );
      await firstValueFrom(
        this.http.post(`${identityUrl}/audit/logs`, dto, {
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
