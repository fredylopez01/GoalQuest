import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GamificationResult } from './interfaces/gamification-result.interface';

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
  private readonly baseUrl: string;
  private readonly internalServiceKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('GAMIFICATION_SERVICE_URL')!;
    this.internalServiceKey = this.configService.get<string>(
      'INTERNAL_SERVICE_KEY',
    )!;
  }

  async notifyTaskCompleted(
    payload: TaskCompletedPayload,
  ): Promise<GamificationResult | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<GamificationResult>(
          `${this.baseUrl}/gamification/task-completed`,
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
