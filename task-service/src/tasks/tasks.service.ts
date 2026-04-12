import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IdentityClient } from 'src/clients/identitiy.client';
import { AuditAction } from 'src/common/enums/audit-action.enum';
import { GoalsService } from 'src/goals/goals.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { FilterTasksDto } from './dto/filter-task.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { TaskDetailResponseDto } from './dto/task-detail-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';
import { GamificationClient } from 'src/clients/gamification.client';
import { ChallengeClient } from 'src/clients/challange.client';
import { GamificationResult } from 'src/clients/interfaces/gamification-result.interface';
import { getEndOfDay, getStartOfDay } from 'src/common/utils/date.utils';
import { CompleteTaskResponseDto } from './dto/complete-task-response.dto';

type TaskWithGoal = Prisma.TaskGetPayload<{
  include: {
    goal: true;
    completions: true;
  };
}>;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goalsService: GoalsService,
    private readonly identityClient: IdentityClient,
    private readonly gamificationClient: GamificationClient,
    private readonly challengeClient: ChallengeClient,
  ) {}

  private sendAuditLog(
    userId: string,
    action: AuditAction,
    description: string,
    ipAddress: string | null,
  ): void {
    this.identityClient.createAuditLog({
      user_id: userId,
      action,
      description,
      ip_address: ipAddress,
    });
  }

  private mapToResponse(task: TaskWithGoal): TaskResponseDto {
    const lastCompletion = task.completions.length
      ? task.completions.sort(
          (a, b) => b.completedAt.getTime() - a.completedAt.getTime(),
        )[0]
      : null;

    return {
      id: task.id,
      goalId: task.goalId,
      goalName: task.goal.name,
      userId: task.goal.userId,
      name: task.name,
      state: task.state,
      difficultyLevel: task.difficultyLevel,
      limitDate: task.limitDate?.toISOString() ?? null,
      frequency: task.frequency,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      lastCompletedAt: lastCompletion?.completedAt.toISOString() ?? null,
    };
  }

  async createTask(
    userId: string,
    dto: CreateTaskDto,
    ipAddress: string | null,
  ): Promise<TaskResponseDto> {
    await this.goalsService.findOneByUser(dto.goalId, userId);

    const task = await this.prisma.task.create({
      data: {
        goalId: dto.goalId,
        name: dto.name,
        difficultyLevel: dto.difficultyLevel,
        limitDate: dto.limitDate ? new Date(dto.limitDate) : null,
        frequency: dto.frequency,
      },
      include: {
        goal: true,
        completions: true,
      },
    });

    this.sendAuditLog(
      userId,
      AuditAction.CREATE_TASK,
      `Tarea "${task.name}" (ID: ${task.id}) creada en meta "${task.goal.name}" (ID: ${task.goalId})`,
      ipAddress,
    );

    return this.mapToResponse(task);
  }

  async findAllByUser(
    userId: string,
    filters: FilterTasksDto,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    const { goalId, state, frequency, date, page = 1, limit = 10 } = filters;

    const where: Prisma.TaskWhereInput = {
      goal: { userId },
      ...(goalId && { goalId }),
      ...(state && { state }),
      ...(frequency !== undefined && { frequency }),
      ...(date && {
        AND: [
          { createdAt: { lte: new Date(`${date}T23:59:59.999Z`) } },
          {
            OR: [
              { limitDate: null },
              { limitDate: { gte: new Date(`${date}T00:00:00.000Z`) } },
            ],
          },
        ],
      }),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          goal: true,
          completions: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map((task) => this.mapToResponse(task)),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async findOneByUser(
    id: number,
    userId: string,
  ): Promise<TaskDetailResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        goal: true,
        completions: true,
      },
    });

    if (!task) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'TASK_NOT_FOUND',
        message: `La tarea con id ${id} no existe`,
      });
    }

    if (task.goal.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'No tienes acceso a esta tarea',
      });
    }

    return this.mapToDetailResponse(task);
  }

  private mapToDetailResponse(task: TaskWithGoal): TaskDetailResponseDto {
    return {
      ...this.mapToResponse(task),
      completions: task.completions
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
        .map((completion) => ({
          id: completion.id,
          taskId: completion.taskId,
          taskName: task.name,
          xpAwarded: completion.xpAwarded,
          completedAt: completion.completedAt.toISOString(),
        })),
    };
  }

  async editTask(
    id: number,
    userId: string,
    dto: UpdateTaskDto,
    ipAddress: string | null,
  ): Promise<TaskResponseDto> {
    await this.findOneByUser(id, userId);

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.difficultyLevel && { difficultyLevel: dto.difficultyLevel }),
        ...(dto.limitDate !== undefined && {
          limitDate: dto.limitDate ? new Date(dto.limitDate) : null,
        }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
      },
      include: {
        goal: true,
        completions: true,
      },
    });

    this.sendAuditLog(
      userId,
      AuditAction.UPDATE_TASK,
      `Tarea "${updatedTask.name}" (ID: ${updatedTask.id}) actualizada`,
      ipAddress,
    );

    return this.mapToResponse(updatedTask);
  }

  async removeByUser(
    id: number,
    userId: string,
    ipAddress: string | null,
  ): Promise<MessageResponseDto> {
    const task = await this.findOneByUser(id, userId);

    await this.prisma.task.delete({
      where: { id },
    });

    this.sendAuditLog(
      userId,
      AuditAction.DELETE_TASK,
      `Tarea "${task.name}" (ID: ${task.id}) eliminada de meta "${task.goalName}" (ID: ${task.goalId})`,
      ipAddress,
    );

    return {
      message: `Tarea "${task.name}" y sus completaciones eliminadas exitosamente`,
    };
  }

  private async validateTaskEligibility(
    taskId: number,
    userId: string,
  ): Promise<TaskWithGoal> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        goal: true,
        completions: true,
      },
    });

    if (!task) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'TASK_NOT_FOUND',
        message: `La tarea con id ${taskId} no existe`,
      });
    }

    if (task.goal.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'No tienes acceso a esta tarea',
      });
    }

    if (task.state === 'completed' && task.frequency === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'TASK_ALREADY_COMPLETED',
        message: 'Esta tarea ya fue completada',
      });
    }

    if (task.frequency > 0) {
      const todayStart = getStartOfDay();
      const todayEnd = getEndOfDay();

      const completedToday = await this.prisma.taskCompletion.findFirst({
        where: {
          taskId,
          completedAt: { gte: todayStart, lte: todayEnd },
        },
      });

      if (completedToday) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'TASK_ALREADY_COMPLETED',
          message: 'Esta tarea ya fue completada hoy',
        });
      }
    }

    return task;
  }

  private async checkAllDailyTasksCompleted(userId: string): Promise<boolean> {
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();

    const dailyTasks = await this.prisma.task.findMany({
      where: {
        goal: { userId },
        frequency: { gt: 0 },
        state: { not: 'expired' },
      },
      select: { id: true },
    });

    if (dailyTasks.length === 0) return true;

    const completedToday = await this.prisma.taskCompletion.count({
      where: {
        task: { goal: { userId } },
        taskId: { in: dailyTasks.map((t) => t.id) },
        completedAt: { gte: todayStart, lte: todayEnd },
      },
    });

    return completedToday >= dailyTasks.length;
  }

  private async getTodayCompletionStats(
    userId: string,
  ): Promise<{ completed: number; total: number }> {
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();

    const totalTasks = await this.prisma.task.count({
      where: {
        goal: { userId },
        state: { not: 'expired' },
      },
    });

    const completedToday = await this.prisma.taskCompletion.count({
      where: {
        task: { goal: { userId } },
        completedAt: { gte: todayStart, lte: todayEnd },
      },
    });

    return { completed: completedToday, total: totalTasks };
  }

  private async createNextInstance(
    task: TaskWithGoal,
  ): Promise<TaskResponseDto | null> {
    if (task.frequency <= 0) return null;

    const nextTask = await this.prisma.task.create({
      data: {
        goalId: task.goalId,
        name: task.name,
        difficultyLevel: task.difficultyLevel,
        limitDate: task.limitDate,
        frequency: task.frequency,
        state: 'pending',
      },
      include: {
        goal: true,
        completions: true,
      },
    });

    return this.mapToResponse(nextTask);
  }

  private buildGamificationResponse(result: GamificationResult | null) {
    if (!result) {
      return {
        xpAwarded: 0,
        xpBreakdown: { base: 0, streak_bonus: 0, achievement_bonus: 0 },
        totalXp: 0,
        currentLevel: 1,
        streak: { consecutiveDays: 0, increased: false },
        newAchievements: [],
        leveledUp: false,
      };
    }

    return {
      xpAwarded: result.xp_awarded,
      xpBreakdown: result.xp_breakdown,
      totalXp: result.total_xp,
      currentLevel: result.current_level,
      streak: {
        consecutiveDays: result.streak.consecutive_days,
        increased: result.streak.increased,
      },
      newAchievements: result.new_achievements,
      leveledUp: result.leveled_up,
    };
  }

  // ─── Método principal ────────────────────────────────────

  async completeTask(
    id: number,
    userId: string,
    ipAddress: string | null,
  ): Promise<CompleteTaskResponseDto> {
    // 1. Validar tarea y elegibilidad
    const task = await this.validateTaskEligibility(id, userId);

    // 2. Actualizar estado y crear completion
    const now = new Date();

    const [updatedTask, completion] = await this.prisma.$transaction([
      this.prisma.task.update({
        where: { id },
        data: { state: 'completed' },
        include: { goal: true, completions: true },
      }),
      this.prisma.taskCompletion.create({
        data: {
          taskId: id,
          completedAt: now,
        },
      }),
    ]);

    // 3. Verificar tareas diarias completadas
    const allDailyCompleted = await this.checkAllDailyTasksCompleted(userId);

    // 4. Notificar a gamification-service
    const gamificationResult =
      await this.gamificationClient.notifyTaskCompleted({
        user_id: userId,
        task_id: id,
        difficulty: task.difficultyLevel,
        frequency: task.frequency,
        all_daily_tasks_completed: allDailyCompleted,
      });

    // 5. Actualizar xpAwarded en la completion
    if (gamificationResult) {
      await this.prisma.taskCompletion.update({
        where: { id: completion.id },
        data: { xpAwarded: gamificationResult.xp_awarded },
      });
    }

    // 6. Notificar a challenge-service
    const stats = await this.getTodayCompletionStats(userId);
    this.challengeClient.updateProgress({
      user_id: userId,
      tasks_completed_today: stats.completed,
      total_tasks_today: stats.total,
      xp_earned: gamificationResult?.xp_awarded ?? 0,
    });

    // 7. Crear nueva instancia si es recurrente
    const nextInstance = await this.createNextInstance(task);

    // 8. Audit log
    this.sendAuditLog(
      userId,
      AuditAction.COMPLETE_TASK,
      `Tarea "${task.name}" (ID: ${task.id}) completada. XP: ${gamificationResult?.xp_awarded ?? 0}`,
      ipAddress,
    );

    return {
      task: {
        id: updatedTask.id,
        name: updatedTask.name,
        state: updatedTask.state,
        completedAt: now.toISOString(),
      },
      gamification: this.buildGamificationResponse(gamificationResult),
      nextInstance,
    };
  }
}
