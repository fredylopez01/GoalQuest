from typing import Literal
from app.cqrs.base import Command


class ProcessTaskCompletedCommand(Command):
    user_id: str
    task_id: int
    difficulty: Literal["easy", "middle", "high"]
    frequency: int
    all_daily_tasks_completed: bool


class ProcessChallengeCompletedCommand(Command):
    user_id: str
    challenge_id: str
    result: Literal["win", "lose", "draw"]
    xp_reward: int
