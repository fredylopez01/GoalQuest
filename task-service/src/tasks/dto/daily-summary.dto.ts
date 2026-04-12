import { ApiProperty } from '@nestjs/swagger';
import { TaskSummaryDto } from './task-summary.dto';

export class DailySummaryDto {
  @ApiProperty({ example: '2025-06-15' })
  date!: string;

  @ApiProperty({ example: 10 })
  totalTasks!: number;

  @ApiProperty({ example: 6 })
  completedTasks!: number;

  @ApiProperty({ example: 4 })
  pendingTasks!: number;

  @ApiProperty({ example: 60.0 })
  completionPercentage!: number;

  @ApiProperty({ type: [TaskSummaryDto] })
  tasks!: TaskSummaryDto[];
}
