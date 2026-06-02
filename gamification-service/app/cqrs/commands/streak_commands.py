from typing import List
from app.cqrs.base import Command


class CheckStreakResetCommand(Command):
    user_ids: List[str]
