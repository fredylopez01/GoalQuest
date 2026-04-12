import { ApiProperty } from '@nestjs/swagger';

export class TaskSummaryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Leer 30 minutos' })
  name!: string;

  @ApiProperty({
    enum: ['pending', 'completed', 'expired'],
    example: 'pending',
  })
  state!: string;

  @ApiProperty({ enum: ['easy', 'middle', 'high'], example: 'middle' })
  difficultyLevel!: string;

  @ApiProperty({ example: 1 })
  frequency!: number;
}
