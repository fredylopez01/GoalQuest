import { ChallengeResponseDto } from './challenge-response.dto';

export class ProgressDto {
  userId!: string;
  name!: string;
  tasksCompleted!: number;
  totalTasks!: number;
  completionPercentage!: number;
  xpEarned!: number;
}

export class ChallengeDetailResponseDto extends ChallengeResponseDto {
  progress!: {
    challenger: ProgressDto;
    opponent: ProgressDto;
  };
}
