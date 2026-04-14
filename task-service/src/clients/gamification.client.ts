import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GamificationResult } from './interfaces/gamification-result.interface';
import { EurekaService } from 'src/eureka/eureka.service';

interface TaskCompletedPayload {
  user_id: string;
  task_id: number;
  difficulty: string;
  frequency: number;
  all_daily_tasks_completed: boolean;
}

@Injectable()
export class GamificationClient {
  private readonly logger = new Logger(GamificationClient.name);
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

  async notifyTaskCompleted(
    payload: TaskCompletedPayload,
  ): Promise<GamificationResult | null> {
    try {
      const gamification_url = this.getServiceUrl(
        'gamification-service',
        'GAMIFICATION_SERVICE_URL',
      );
      const { data } = await firstValueFrom(
        this.httpService.post<GamificationResult>(
          `${gamification_url}/gamification/task-completed`,
          payload,
          {
            headers: { 'X-Internal-Service-Key': this.internalServiceKey },
          },
        ),
      );
      return data;
    } catch (error: any) {
      this.logger.warn(
        `Failed to notify gamification for task ${payload.task_id}: ${error.message}`,
      );
      return null;
    }
  }
}
