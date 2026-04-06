import { Injectable } from '@nestjs/common';
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
}
