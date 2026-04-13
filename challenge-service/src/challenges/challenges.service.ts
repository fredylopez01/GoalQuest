import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { Challenge, ChallengeDocument } from './schemas/challenge.schema';
import {
  ChallengeProgress,
  ChallengeProgressDocument,
} from './schemas/challenge-progress.schema';

import { ChallengeState } from './enums/challenge-state.enum';
import { ChallengeResult } from './enums/challenge-result.enum';
import { ChallengeCondition } from './enums/challenge-condition.enum';

import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ChallengeResponseDto } from './dto/challenge-response.dto';
import {
  ChallengeDetailResponseDto,
  ProgressDto,
} from './dto/challenge-detail-response.dto';
import {
  UpdateProgressResponseDto,
  CompletedChallengeInfo,
} from './dto/update-progress-response.dto';
import {
  CheckExpiredResponseDto,
  ExpiredChallengeResult,
} from './dto/check-expired-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { EurekaService } from '../eureka/eureka.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { HttpStatus } from '@nestjs/common';
import { ChallengeRole, QueryChallengesDto } from './dto/query-challenges.dto';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    @InjectModel(Challenge.name)
    private readonly challengeModel: Model<ChallengeDocument>,
    @InjectModel(ChallengeProgress.name)
    private readonly progressModel: Model<ChallengeProgressDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly eurekaService: EurekaService,
  ) {}

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

  // ============================================================
  // HELPER: Obtener nombre de usuario desde identity-service
  // ============================================================
  private async getUserName(userId: string): Promise<string> {
    try {
      const identityUrl = this.getServiceUrl(
        'identity-service',
        'IDENTITY_SERVICE_URL',
      );

      const internalKey = this.configService.get<string>(
        'INTERNAL_SERVICE_KEY',
      );

      const { data } = await firstValueFrom(
        this.httpService.get(`${identityUrl}/users/${userId}`, {
          headers: { 'X-Internal-Service-Key': internalKey },
        }),
      );

      return data.name || 'Unknown';
    } catch (error: any) {
      this.logger.warn(
        `Could not fetch user name for ${userId}: ${error.message}`,
      );
      return 'Unknown';
    }
  }

  // ============================================================
  // HELPER: Calcular días restantes
  // ============================================================
  private calculateDaysRemaining(endDate: Date | null): number | null {
    if (!endDate) return null;
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // ============================================================
  // HELPER: Mapear Challenge a ChallengeResponseDto
  // ============================================================
  private async mapToResponseDto(
    challenge: ChallengeDocument,
    currentUserId: string,
  ): Promise<ChallengeResponseDto> {
    const [challengerName, opponentName] = await Promise.all([
      this.getUserName(challenge.challengerId),
      this.getUserName(challenge.opponentId),
    ]);

    return {
      id: challenge._id.toString(),
      challengerId: challenge.challengerId,
      challengerName,
      opponentId: challenge.opponentId,
      opponentName,
      condition: challenge.condition,
      state: challenge.state,
      durationDays: challenge.durationDays,
      startDate: challenge.startDate?.toISOString() || null,
      endDate: challenge.endDate?.toISOString() || null,
      daysRemaining: this.calculateDaysRemaining(challenge.endDate),
      result: challenge.result,
      myRole:
        challenge.challengerId === currentUserId ? 'challenger' : 'opponent',
      createdAt: challenge.createdAt.toISOString(),
    };
  }

  // ============================================================
  // HELPER: Notificar gamification-service sobre challenge completado
  // ============================================================
  private async notifyGamificationChallengeCompleted(
    userId: string,
    challengeId: string,
    result: string,
    xpReward: number,
  ): Promise<void> {
    try {
      const gamificationUrl = this.getServiceUrl(
        'gamification-service',
        'GAMIFICATION_SERVICE_URL',
      );
      const internalKey = this.configService.get<string>(
        'INTERNAL_SERVICE_KEY',
      );

      await firstValueFrom(
        this.httpService.post(
          `${gamificationUrl}/gamification/challenge-completed`,
          {
            user_id: userId,
            challenge_id: challengeId,
            result,
            xp_reward: xpReward,
          },
          {
            headers: { 'X-Internal-Service-Key': internalKey },
          },
        ),
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to notify gamification for user ${userId}: ${error.message}`,
      );
    }
  }

  // ============================================================
  // HELPER: Determinar ganador según condición
  // ============================================================
  private determineWinner(
    challenge: ChallengeDocument,
    challengerProgress: ChallengeProgressDocument,
    opponentProgress: ChallengeProgressDocument,
  ): ChallengeResult {
    let challengerScore: number;
    let opponentScore: number;

    switch (challenge.condition) {
      case ChallengeCondition.PERCENT:
        challengerScore =
          challengerProgress.totalTasks > 0
            ? (challengerProgress.tasksCompleted /
                challengerProgress.totalTasks) *
              100
            : 0;
        opponentScore =
          opponentProgress.totalTasks > 0
            ? (opponentProgress.tasksCompleted / opponentProgress.totalTasks) *
              100
            : 0;
        break;

      case ChallengeCondition.NUM_TASKS:
        challengerScore = challengerProgress.tasksCompleted;
        opponentScore = opponentProgress.tasksCompleted;
        break;

      case ChallengeCondition.LEVEL:
        // Para "level" se usa xpEarned como proxy (el nivel real viene de gamification)
        challengerScore = challengerProgress.xpEarned;
        opponentScore = opponentProgress.xpEarned;
        break;

      default:
        challengerScore = challengerProgress.tasksCompleted;
        opponentScore = opponentProgress.tasksCompleted;
    }

    if (challengerScore > opponentScore) return ChallengeResult.CHALLENGER_WINS;
    if (opponentScore > challengerScore) return ChallengeResult.OPPONENT_WINS;
    return ChallengeResult.DRAW;
  }

  // ============================================================
  // CS-01: Crear un desafío
  // ============================================================
  async createChallenge(
    dto: CreateChallengeDto,
    user: AuthenticatedUser,
  ): Promise<ChallengeResponseDto> {
    const challengerId = user.user_id;

    // No puede desafiarse a sí mismo
    if (challengerId === dto.opponentId) {
      throw new BusinessException(
        'VALIDATION_ERROR',
        'You cannot challenge yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verificar que el oponente existe
    try {
      const identityUrl = this.getServiceUrl(
        'identity-service',
        'IDENTITY_SERVICE_URL',
      );
      const internalKey = this.configService.get<string>(
        'INTERNAL_SERVICE_KEY',
      );

      await firstValueFrom(
        this.httpService.get(`${identityUrl}/users/${dto.opponentId}`, {
          headers: { 'X-Internal-Service-Key': internalKey },
        }),
      );
    } catch (error) {
      throw new BusinessException(
        'OPPONENT_NOT_FOUND',
        'The opponent user does not exist',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verificar que no hay desafío activo o pendiente entre ambos
    const existingChallenge = await this.challengeModel.findOne({
      $or: [
        { challengerId, opponentId: dto.opponentId },
        { challengerId: dto.opponentId, opponentId: challengerId },
      ],
      state: { $in: [ChallengeState.PENDING, ChallengeState.ACTIVE] },
    });

    if (existingChallenge) {
      throw new BusinessException(
        'ACTIVE_CHALLENGE_EXISTS',
        'There is already an active or pending challenge between these users',
        HttpStatus.CONFLICT,
      );
    }

    const challenge = await this.challengeModel.create({
      challengerId,
      opponentId: dto.opponentId,
      condition: dto.condition,
      state: ChallengeState.PENDING,
      durationDays: dto.durationDays,
      startDate: null,
      endDate: null,
      result: null,
    });

    return this.mapToResponseDto(challenge, challengerId);
  }

  // ============================================================
  // CS-02: Listar desafíos del usuario
  // ============================================================
  async getChallenges(
    query: QueryChallengesDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<ChallengeResponseDto>> {
    const userId = user.user_id;
    const { state, role, page = 1, limit = 10 } = query;

    const filter: Record<string, unknown> = {};

    // Filtro por rol
    const effectiveRole = role || ChallengeRole.ALL;
    if (effectiveRole === ChallengeRole.CHALLENGER) {
      filter.challengerId = userId;
    } else if (effectiveRole === ChallengeRole.OPPONENT) {
      filter.opponentId = userId;
    } else {
      filter.$or = [{ challengerId: userId }, { opponentId: userId }];
    }

    // Filtro por estado
    if (state) {
      filter.state = state;
    }

    const skip = (page - 1) * limit;

    const [challenges, total] = await Promise.all([
      this.challengeModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.challengeModel.countDocuments(filter).exec(),
    ]);

    const data = await Promise.all(
      challenges.map((c) => this.mapToResponseDto(c, userId)),
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  // ============================================================
  // CS-03: Obtener detalle de un desafío
  // ============================================================
  async getChallengeDetail(
    challengeId: string,
    user: AuthenticatedUser,
  ): Promise<ChallengeDetailResponseDto> {
    const userId = user.user_id;

    const challenge = await this.challengeModel.findById(challengeId).exec();

    if (!challenge) {
      throw new BusinessException(
        'CHALLENGE_NOT_FOUND',
        'Challenge not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (challenge.challengerId !== userId && challenge.opponentId !== userId) {
      throw new BusinessException(
        'FORBIDDEN',
        'You are not a participant of this challenge',
        HttpStatus.FORBIDDEN,
      );
    }

    const baseResponse = await this.mapToResponseDto(challenge, userId);

    // Obtener progreso
    const challengeObjectId = new Types.ObjectId(challengeId);

    const [challengerProgress, opponentProgress] = await Promise.all([
      this.progressModel
        .findOne({
          challengeId: challengeObjectId,
          userId: challenge.challengerId,
        })
        .exec(),
      this.progressModel
        .findOne({
          challengeId: challengeObjectId,
          userId: challenge.opponentId,
        })
        .exec(),
    ]);

    const [challengerName, opponentName] = await Promise.all([
      this.getUserName(challenge.challengerId),
      this.getUserName(challenge.opponentId),
    ]);

    const mapProgress = (
      progress: ChallengeProgressDocument | null,
      uId: string,
      name: string,
    ): ProgressDto => ({
      userId: uId,
      name,
      tasksCompleted: progress?.tasksCompleted || 0,
      totalTasks: progress?.totalTasks || 0,
      completionPercentage:
        progress && progress.totalTasks > 0
          ? Math.round(
              (progress.tasksCompleted / progress.totalTasks) * 100 * 100,
            ) / 100
          : 0,
      xpEarned: progress?.xpEarned || 0,
    });

    return {
      ...baseResponse,
      progress: {
        challenger: mapProgress(
          challengerProgress,
          challenge.challengerId,
          challengerName,
        ),
        opponent: mapProgress(
          opponentProgress,
          challenge.opponentId,
          opponentName,
        ),
      },
    };
  }

  // ============================================================
  // CS-04: Aceptar un desafío
  // ============================================================
  async acceptChallenge(
    challengeId: string,
    user: AuthenticatedUser,
  ): Promise<ChallengeResponseDto> {
    const userId = user.user_id;

    const challenge = await this.challengeModel.findById(challengeId).exec();

    if (!challenge) {
      throw new BusinessException(
        'CHALLENGE_NOT_FOUND',
        'Challenge not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (challenge.opponentId !== userId) {
      throw new BusinessException(
        'NOT_OPPONENT',
        'Only the opponent can accept this challenge',
        HttpStatus.FORBIDDEN,
      );
    }

    if (challenge.state !== ChallengeState.PENDING) {
      throw new BusinessException(
        'INVALID_STATE',
        `Challenge is in state "${challenge.state}", expected "pending"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + challenge.durationDays);

    challenge.state = ChallengeState.ACTIVE;
    challenge.startDate = now;
    challenge.endDate = endDate;
    await challenge.save();

    // Crear progreso para ambos participantes
    const challengeObjectId = challenge._id as Types.ObjectId;

    await this.progressModel.create([
      {
        challengeId: challengeObjectId,
        userId: challenge.challengerId,
        tasksCompleted: 0,
        totalTasks: 0,
        xpEarned: 0,
      },
      {
        challengeId: challengeObjectId,
        userId: challenge.opponentId,
        tasksCompleted: 0,
        totalTasks: 0,
        xpEarned: 0,
      },
    ]);

    return this.mapToResponseDto(challenge, userId);
  }

  // ============================================================
  // CS-05: Rechazar un desafío
  // ============================================================
  async rejectChallenge(
    challengeId: string,
    user: AuthenticatedUser,
  ): Promise<{ id: string; state: string; message: string }> {
    const userId = user.user_id;

    const challenge = await this.challengeModel.findById(challengeId).exec();

    if (!challenge) {
      throw new BusinessException(
        'CHALLENGE_NOT_FOUND',
        'Challenge not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (challenge.opponentId !== userId) {
      throw new BusinessException(
        'NOT_OPPONENT',
        'Only the opponent can reject this challenge',
        HttpStatus.FORBIDDEN,
      );
    }

    if (challenge.state !== ChallengeState.PENDING) {
      throw new BusinessException(
        'INVALID_STATE',
        `Challenge is in state "${challenge.state}", expected "pending"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    challenge.state = ChallengeState.REJECTED;
    await challenge.save();

    return {
      id: challenge._id.toString(),
      state: ChallengeState.REJECTED,
      message: 'Challenge rejected successfully',
    };
  }

  // ============================================================
  // CS-06: Cancelar un desafío
  // ============================================================
  async cancelChallenge(
    challengeId: string,
    user: AuthenticatedUser,
  ): Promise<{ id: string; state: string; message: string }> {
    const userId = user.user_id;

    const challenge = await this.challengeModel.findById(challengeId).exec();

    if (!challenge) {
      throw new BusinessException(
        'CHALLENGE_NOT_FOUND',
        'Challenge not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (challenge.challengerId !== userId) {
      throw new BusinessException(
        'NOT_CHALLENGER',
        'Only the challenger can cancel this challenge',
        HttpStatus.FORBIDDEN,
      );
    }

    if (challenge.state !== ChallengeState.PENDING) {
      throw new BusinessException(
        'INVALID_STATE',
        `Challenge is in state "${challenge.state}", expected "pending"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    challenge.state = ChallengeState.CANCELLED;
    await challenge.save();

    return {
      id: challenge._id.toString(),
      state: ChallengeState.CANCELLED,
      message: 'Challenge cancelled successfully',
    };
  }

  // ============================================================
  // CS-07: Actualizar progreso (interno, llamado por task-service)
  // ============================================================
  async updateProgress(
    dto: UpdateProgressDto,
  ): Promise<UpdateProgressResponseDto> {
    const { user_id, tasks_completed_today, total_tasks_today, xp_earned } =
      dto;

    // Buscar todos los challenges activos donde participa el usuario
    const activeChallenges = await this.challengeModel
      .find({
        state: ChallengeState.ACTIVE,
        $or: [{ challengerId: user_id }, { opponentId: user_id }],
      })
      .exec();

    const updatedChallenges: string[] = [];
    const completedChallenges: CompletedChallengeInfo[] = [];

    for (const challenge of activeChallenges) {
      const challengeObjectId = challenge._id as Types.ObjectId;

      // Actualizar progreso del usuario
      await this.progressModel.findOneAndUpdate(
        { challengeId: challengeObjectId, userId: user_id },
        {
          $inc: {
            tasksCompleted: tasks_completed_today,
            totalTasks: total_tasks_today,
            xpEarned: xp_earned,
          },
        },
        { upsert: true, new: true },
      );

      updatedChallenges.push(challenge._id.toString());

      // Verificar si el challenge ha expirado
      const now = new Date();
      if (challenge.endDate && challenge.endDate <= now) {
        const completedInfo = await this.resolveChallenge(challenge);
        if (completedInfo) {
          completedChallenges.push(completedInfo);
        }
      }
    }

    return {
      updated_challenges: updatedChallenges,
      completed_challenges: completedChallenges,
    };
  }

  // ============================================================
  // HELPER: Resolver un challenge (determinar ganador, notificar)
  // ============================================================
  private async resolveChallenge(
    challenge: ChallengeDocument,
  ): Promise<CompletedChallengeInfo | null> {
    try {
      const challengeObjectId = challenge._id as Types.ObjectId;

      const [challengerProgress, opponentProgress] = await Promise.all([
        this.progressModel
          .findOne({
            challengeId: challengeObjectId,
            userId: challenge.challengerId,
          })
          .exec(),
        this.progressModel
          .findOne({
            challengeId: challengeObjectId,
            userId: challenge.opponentId,
          })
          .exec(),
      ]);

      if (!challengerProgress || !opponentProgress) {
        this.logger.warn(`Missing progress for challenge ${challenge._id}`);
        return null;
      }

      const result = this.determineWinner(
        challenge,
        challengerProgress,
        opponentProgress,
      );

      challenge.state = ChallengeState.COMPLETED;
      challenge.result = result;
      await challenge.save();

      const xpWinner = this.configService.get<number>('XP_REWARD_WINNER', 100);
      const xpLoser = this.configService.get<number>('XP_REWARD_LOSER', 25);
      const xpDraw = this.configService.get<number>('XP_REWARD_DRAW', 50);

      const challengeIdStr = challenge._id.toString();

      // Notificar gamification
      if (result === ChallengeResult.DRAW) {
        await Promise.all([
          this.notifyGamificationChallengeCompleted(
            challenge.challengerId,
            challengeIdStr,
            'draw',
            xpDraw,
          ),
          this.notifyGamificationChallengeCompleted(
            challenge.opponentId,
            challengeIdStr,
            'draw',
            xpDraw,
          ),
        ]);
      } else {
        const winnerId =
          result === ChallengeResult.CHALLENGER_WINS
            ? challenge.challengerId
            : challenge.opponentId;
        const loserId =
          result === ChallengeResult.CHALLENGER_WINS
            ? challenge.opponentId
            : challenge.challengerId;

        await Promise.all([
          this.notifyGamificationChallengeCompleted(
            winnerId,
            challengeIdStr,
            'win',
            xpWinner,
          ),
          this.notifyGamificationChallengeCompleted(
            loserId,
            challengeIdStr,
            'lose',
            xpLoser,
          ),
        ]);
      }

      return {
        id: challengeIdStr,
        result,
        xp_reward_winner: result === ChallengeResult.DRAW ? xpDraw : xpWinner,
        xp_reward_loser: result === ChallengeResult.DRAW ? xpDraw : xpLoser,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to resolve challenge ${challenge._id}: ${error.message}`,
      );
      return null;
    }
  }

  // ============================================================
  // CS-08: Verificar y cerrar desafíos expirados (CRON)
  // ============================================================
  async checkExpired(): Promise<CheckExpiredResponseDto> {
    const now = new Date();

    const expiredChallenges = await this.challengeModel
      .find({
        state: ChallengeState.ACTIVE,
        endDate: { $lte: now },
      })
      .exec();

    const results: ExpiredChallengeResult[] = [];

    for (const challenge of expiredChallenges) {
      const completedInfo = await this.resolveChallenge(challenge);

      if (completedInfo) {
        const result = completedInfo.result as ChallengeResult;
        let winnerId: string;
        let loserId: string;

        if (result === ChallengeResult.DRAW) {
          winnerId = challenge.challengerId;
          loserId = challenge.opponentId;
        } else if (result === ChallengeResult.CHALLENGER_WINS) {
          winnerId = challenge.challengerId;
          loserId = challenge.opponentId;
        } else {
          winnerId = challenge.opponentId;
          loserId = challenge.challengerId;
        }

        results.push({
          challengeId: challenge._id.toString(),
          result: completedInfo.result,
          winnerId,
          loserId,
        });
      }
    }

    return {
      processed: results.length,
      results,
    };
  }
}
