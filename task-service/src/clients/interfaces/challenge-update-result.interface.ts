export interface CompletedChallenge {
  id: string;
  result: string;
  xp_reward_winner: number;
  xp_reward_loser: number;
}

export interface ChallengeUpdateResult {
  updated_challenges: string[];
  completed_challenges: CompletedChallenge[];
}
