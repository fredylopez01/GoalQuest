import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { Goal } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGoal(userId: string, dto: CreateGoalDto): Promise<Goal> {
    return this.prisma.goal.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description || null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        maxDaysLater: dto.maxDaysLater ?? null,
      },
    });
  }

  async findAllByUser(userId: string): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: { userId },
      include: { tasks: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByUser(id: number, userId: string): Promise<Goal> {
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

  async editGoal(
    id: number,
    dataToUpdate: Partial<CreateGoalDto>,
  ): Promise<Goal> {
    const updatedGoal = await this.prisma.goal.update({
      where: { id },
      data: dataToUpdate,
    });

    return updatedGoal;
  }
}
