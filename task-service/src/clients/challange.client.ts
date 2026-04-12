import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ChallengeUpdateResult } from './interfaces/challenge-update-result.interface';

interface UpdateProgressPayload {
  user_id: string;
  tasks_completed_today: number;
  total_tasks_today: number;
  xp_earned: number;
}

@Injectable()
export class ChallengeClient {
  private readonly logger = new Logger(ChallengeClient.name);
  private readonly baseUrl: string;
  private readonly internalServiceKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('CHALLENGE_SERVICE_URL')!;
    this.internalServiceKey = this.configService.get<string>(
      'INTERNAL_SERVICE_KEY',
    )!;
  }

  async updateProgress(
    payload: UpdateProgressPayload,
  ): Promise<ChallengeUpdateResult | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<ChallengeUpdateResult>(
          `${this.baseUrl}/challenges/update-progress`,
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
