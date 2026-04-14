import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ChallengeUpdateResult } from './interfaces/challenge-update-result.interface';
import { EurekaService } from 'src/eureka/eureka.service';

interface UpdateProgressPayload {
  user_id: string;
  tasks_completed_today: number;
  total_tasks_today: number;
  xp_earned: number;
}

@Injectable()
export class ChallengeClient {
  private readonly logger = new Logger(ChallengeClient.name);
  private readonly internalServiceKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly eurekaService: EurekaService,
  ) {
    this.internalServiceKey = this.configService.get<string>(
      'INTERNAL_SERVICE_KEY',
    )!;
  }

  // ============================================================
  // HELPER: Obtener URL de un servicio (Eureka con fallback)
  // ============================================================
  private getServiceUrl(serviceName: string, fallbackEnvKey: string): string {
    const eurekaUrl = this.eurekaService.getServiceUrl(serviceName);
    if (eurekaUrl) return eurekaUrl;

    const fallbackUrl = this.configService.get<string>(fallbackEnvKey);
    if (!fallbackUrl) {
      throw new Error(
        `Service "${serviceName}" not found in Eureka and fallback env var "${fallbackEnvKey}" is not configured`,
      );
    }

    return fallbackUrl;
  }

  async updateProgress(
    payload: UpdateProgressPayload,
  ): Promise<ChallengeUpdateResult | null> {
    try {
      const challenge_url = this.getServiceUrl(
        'challenge-service',
        'CHALLENGE_SERVICE_URL',
      );
      const { data } = await firstValueFrom(
        this.httpService.post<ChallengeUpdateResult>(
          `${challenge_url}/challenges/update-progress`,
          payload,
          {
            headers: { 'X-Internal-Service-Key': this.internalServiceKey },
          },
        ),
      );
      return data;
    } catch (error: any) {
      this.logger.warn(
        `Failed to update challenge progress for user ${payload.user_id}: ${error.message}`,
      );
      return null;
    }
  }
}
