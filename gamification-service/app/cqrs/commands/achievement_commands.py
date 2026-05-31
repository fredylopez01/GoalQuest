from typing import Literal
from app.cqrs.base import Command


class CreateAchievementCommand(Command):
    code: str
    name: str
    description: str
    condition_type: Literal["streak", "tasks_completed", "level"]
    threshold_value: int
    xp_reward: int
