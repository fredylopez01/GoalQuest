from beanie import Document, Indexed
from typing import Literal

class Achievement(Document):
    code: Indexed(str, unique=True)
    name: str
    description: str
    condition_type: Literal["streak", "tasks_completed", "level"]
    threshold_value: int
    xp_reward: int

    class Settings:
        name = "achievements"