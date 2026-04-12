import { ApiProperty } from '@nestjs/swagger';
import { TaskResponseDto } from './task-response.dto';
import { TaskCompletionDto } from './task-completion.dto';

export class TaskDetailResponseDto extends TaskResponseDto {
  @ApiProperty({ type: [TaskCompletionDto] })
  completions!: TaskCompletionDto[];
}
