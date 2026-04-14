import { ApiProperty } from '@nestjs/swagger';

export class TaskCompletionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  taskId!: number;

  @ApiProperty({ example: 'Leer 30 minutos' })
  taskName!: string;

  @ApiProperty({ example: 25 })
  xpAwarded!: number;

  @ApiProperty({ example: '2025-06-05T14:30:00.000Z' })
  completedAt!: string;
}
