import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  goalId!: number;

  @ApiProperty({ example: 'Aprender NestJS' })
  goalName!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId!: string;

  @ApiProperty({ example: 'Leer 30 minutos' })
  name!: string;

  @ApiProperty({
    enum: ['pending', 'completed', 'expired'],
    example: 'pending',
  })
  state!: string;

  @ApiProperty({ enum: ['easy', 'middle', 'high'], example: 'middle' })
  difficultyLevel!: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z' })
  limitDate!: string | null;

  @ApiProperty({ example: 1 })
  frequency!: number;

  @ApiProperty({ example: '2025-06-01T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-06-01T10:00:00.000Z' })
  updatedAt!: string;

  @ApiPropertyOptional({ example: '2025-06-05T14:30:00.000Z' })
  lastCompletedAt!: string | null;
}
