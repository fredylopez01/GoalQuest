export interface GamificationAchievement {
  id: string;
  code: string;
  name: string;
  description: string;
  xp_reward: number;
}

export interface GamificationResult {
  xp_awarded: number;
  xp_breakdown: {
    base: number;
    streak_bonus: number;
    achievement_bonus: number;
  };
  total_xp: number;
  current_level: number;
  previous_level: number;
  leveled_up: boolean;
  streak: {
    consecutive_days: number;
    increased: boolean;
    max_streak: number;
  };
  new_achievements: GamificationAchievement[];
}
