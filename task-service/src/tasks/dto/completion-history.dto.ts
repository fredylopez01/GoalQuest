import { ApiProperty } from '@nestjs/swagger';
import { TaskCompletionDto } from './task-completion.dto';

class CompletionSummaryDto {
  @ApiProperty({ example: 15 })
  totalCompleted!: number;

  @ApiProperty({ example: 375 })
  totalXpEarned!: number;
}

export class CompletionHistoryDto {
  @ApiProperty({ type: [TaskCompletionDto] })
  data!: TaskCompletionDto[];

  @ApiProperty({ type: CompletionSummaryDto })
  summary!: CompletionSummaryDto;
}
