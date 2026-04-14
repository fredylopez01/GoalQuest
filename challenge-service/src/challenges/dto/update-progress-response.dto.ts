export class CompletedChallengeInfo {
  id!: string;
  result!: string;
  xp_reward_winner!: number;
  xp_reward_loser!: number;
}

export class UpdateProgressResponseDto {
  updated_challenges!: string[];
  completed_challenges!: CompletedChallengeInfo[];
}
