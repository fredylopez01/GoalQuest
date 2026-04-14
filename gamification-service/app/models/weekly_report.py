from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Literal

class WeeklyReport(Document):
    user_id: str
    start_week: str
    end_week: str
    completed_tasks: int
    total_tasks: int
    completion_percentage: float
    xp_earned: int
    level_reached: int
    trend: Literal["increasing", "stable", "decreasing"]
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "weekly_reports"