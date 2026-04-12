import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { Goal, Prisma } from '@prisma/client';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';
import { IdentityClient } from 'src/clients/identitiy.client';
import { AuditAction } from 'src/common/enums/audit-action.enum';

type GoalWithTasks = Prisma.GoalGetPayload<{
  include: { tasks: true };
}>;

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
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

  async findOneByUser(id: number, userId: string): Promise<GoalWithTasks> {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!goal) {
      throw new NotFoundException(`La meta con id ${id} no existe`);
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta meta');
    }

    return goal;
  }

  async createGoal(
    userId: string,
    dto: CreateGoalDto,
    ipAddress: string | null,
  ): Promise<Goal> {
    const goal = await this.prisma.goal.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description || null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        maxDaysLater: dto.maxDaysLater ?? null,
      },
    });

    this.sendAuditLog(
      userId,
      AuditAction.CREATE_GOAL,
      `Meta "${goal.name}" (ID: ${goal.id}) creada`,
      ipAddress,
    );

    return goal;
  }

  async findAllByUser(userId: string): Promise<GoalWithTasks[]> {
    return this.prisma.goal.findMany({
      where: { userId },
      include: { tasks: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async editGoal(
    id: number,
    userId: string,
    dataToUpdate: Partial<CreateGoalDto>,
    ipAddress: string | null,
  ): Promise<GoalWithTasks> {
    const goal = await this.findOneByUser(id, userId);

    const updatedGoal = await this.prisma.goal.update({
      where: { id },
      data: dataToUpdate,
      include: { tasks: true },
    });

    this.sendAuditLog(
      userId,
      AuditAction.UPDATE_GOAL,
      `Meta "${goal.name}" (ID: ${goal.id}) actualizada`,
      ipAddress,
    );

    return updatedGoal;
  }

  async removeByUser(
    id: number,
    userId: string,
    ipAddress: string | null,
  ): Promise<MessageResponseDto> {
    const goal = await this.findOneByUser(id, userId);
    const taskCount = goal.tasks.length;

    await this.prisma.goal.delete({
      where: { id },
    });

    this.sendAuditLog(
      userId,
      AuditAction.DELETE_GOAL,
      `Meta "${goal.name}" (ID: ${goal.id}) eliminada con ${taskCount} tarea(s) asociada(s)`,
      ipAddress,
    );

    return {
      message: `Meta "${goal.name}" y sus ${taskCount} tarea(s) asociada(s) eliminadas exitosamente`,
    };
  }

  async reopenGoal(
    id: number,
    userId: string,
    ipAddress: string | null,
  ): Promise<GoalWithTasks> {
    const goal = await this.findOneByUser(id, userId);

    if (goal.state === 'pending') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'INVALID_STATE',
        message: 'La meta ya se encuentra en estado pendiente',
      });
    }

    const reopenedGoal = await this.prisma.goal.update({
      where: { id },
      data: { state: 'pending' },
      include: { tasks: true },
    });

    this.sendAuditLog(
      userId,
      AuditAction.REOPEN_GOAL,
      `Meta "${goal.name}" (ID: ${goal.id}) reabierta desde estado "${goal.state}"`,
      ipAddress,
    );

    return reopenedGoal;
  }
}
