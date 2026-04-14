from pydantic import BaseModel
from typing import List

class StreakResponseDTO(BaseModel):
    user_id: str
    consecutive_days: int
    max_streak: int
    last_day: str
    streak_active: bool

class CheckResetRequestDTO(BaseModel):
    user_ids: List[str]

class CheckResetResponseDTO(BaseModel):
    reset_count: int
    reset_users: List[str]