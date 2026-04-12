import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskResponseDto } from './task-response.dto';

class AchievementDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ example: 'FIRST_TASK' })
  code!: string;

  @ApiProperty({ example: 'Primera tarea' })
  name!: string;

  @ApiProperty({ example: 'Completa tu primera tarea' })
  description!: string;

  @ApiProperty({ example: 50 })
  xp_reward!: number;
}

class XpBreakdownDto {
  @ApiProperty({ example: 25 })
  base!: number;

  @ApiProperty({ example: 4 })
  streak_bonus!: number;

  @ApiProperty({ example: 50 })
  achievement_bonus!: number;
}

class StreakDto {
  @ApiProperty({ example: 3 })
  consecutiveDays!: number;

  @ApiProperty({ example: true })
  increased!: boolean;
}

class CompletedTaskInfoDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Leer 30 minutos' })
  name!: string;

  @ApiProperty({ example: 'completed' })
  state!: string;

  @ApiProperty({ example: '2025-06-15T14:30:00.000Z' })
  completedAt!: string;
}

class GamificationInfoDto {
  @ApiProperty({ example: 79 })
  xpAwarded!: number;

  @ApiProperty({ type: XpBreakdownDto })
  xpBreakdown!: XpBreakdownDto;

  @ApiProperty({ example: 250 })
  totalXp!: number;

  @ApiProperty({ example: 3 })
  currentLevel!: number;

  @ApiProperty({ type: StreakDto })
  streak!: StreakDto;

  @ApiProperty({ type: [AchievementDto] })
  newAchievements!: AchievementDto[];

  @ApiProperty({ example: false })
  leveledUp!: boolean;
}

export class CompleteTaskResponseDto {
  @ApiProperty({ type: CompletedTaskInfoDto })
  task!: CompletedTaskInfoDto;

  @ApiProperty({ type: GamificationInfoDto })
  gamification!: GamificationInfoDto;

  @ApiPropertyOptional({ type: TaskResponseDto, nullable: true })
  nextInstance!: TaskResponseDto | null;
}
