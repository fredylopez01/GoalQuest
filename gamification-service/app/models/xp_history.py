from beanie import Document
from datetime import datetime
from pydantic import Field
from typing import Literal, Optional

class XpHistory(Document):
    user_id: str
    xp_awarded: int
    source: Literal["task_completion", "achievement", "challenge_win"]
    source_id: str
    difficulty: Optional[str] = None
    streak_bonus: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "xp_history"