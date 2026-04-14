from pydantic import BaseModel
from typing import Optional

class CreateProfileDTO(BaseModel):
    user_id: str

class StreakInfo(BaseModel):
    consecutive_days: int
    max_streak: int
    last_day: str

class ProfileResponseDTO(BaseModel):
    user_id: str
    xp_total: int
    current_level: int
    xp_to_next_level: int
    xp_progress_percentage: float
    streak: StreakInfo
    achievements_count: int
    total_achievements: int