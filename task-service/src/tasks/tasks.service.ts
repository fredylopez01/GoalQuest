import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IdentityClient } from 'src/clients/identitiy.client';
import { AuditAction } from 'src/common/enums/audit-action.enum';
import { GoalsService } from 'src/goals/goals.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';

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
}
