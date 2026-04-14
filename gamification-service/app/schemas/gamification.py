from pydantic import BaseModel
from typing import Literal, List
from app.schemas.achievement import AchievementDTO

class TaskCompletedEventDTO(BaseModel):
    user_id: str
    task_id: int
    difficulty: Literal["easy", "middle", "high"]
    frequency: int
    all_daily_tasks_completed: bool

class XpBreakdown(BaseModel):
    base: int
    streak_bonus: int
    achievement_bonus: int

class StreakResult(BaseModel):
    consecutive_days: int
    increased: bool
    max_streak: int

class GamificationResultDTO(BaseModel):
    xp_awarded: int
    xp_breakdown: XpBreakdown
    total_xp: int
    current_level: int
    previous_level: int
    leveled_up: bool
    streak: StreakResult
    new_achievements: List[AchievementDTO]

class ChallengeCompletedEventDTO(BaseModel):
    user_id: str
    challenge_id: str
    result: Literal["win", "lose", "draw"]
    xp_reward: int

class ChallengeXpResultDTO(BaseModel):
    xp_awarded: int
    total_xp: int
    current_level: int
    leveled_up: bool
    new_achievements: List[AchievementDTO]