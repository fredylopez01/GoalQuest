import {
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
}
