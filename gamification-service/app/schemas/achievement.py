from pydantic import BaseModel
from typing import Literal, Optional

class AchievementDTO(BaseModel):
    id: str
    code: str
    name: str
    description: str
    xp_reward: int

class UserAchievementDTO(AchievementDTO):
    rewarded_at: str

class LockedAchievementDTO(AchievementDTO):
    progress: int
    threshold: int

class CreateAchievementDTO(BaseModel):
    code: str
    name: str
    description: str
    condition_type: Literal["streak", "tasks_completed", "level"]
    threshold_value: int
    xp_reward: int