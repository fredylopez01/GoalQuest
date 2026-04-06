import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StateGoal } from '@prisma/client';

export class GoalResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'uuid-string' })
  userId!: string;

  @ApiProperty({ example: 'Aprender inglés' })
  name!: string;

  @ApiPropertyOptional({ example: 'Estudiar inglés todos los días' })
  description!: string | null;

  @ApiPropertyOptional({ example: '2025-03-01T00:00:00.000Z' })
  endDate!: Date | null;

  @ApiProperty({ enum: StateGoal, example: 'pending' })
  state!: StateGoal;

  @ApiPropertyOptional({ example: 3 })
  maxDaysLater!: number | null;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  updatedAt!: Date;
}
