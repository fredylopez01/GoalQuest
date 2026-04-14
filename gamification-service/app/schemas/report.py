from pydantic import BaseModel
from typing import Literal, List, Optional

class WeeklyReportRequestDTO(BaseModel):
    user_id: str
    start_week: str
    end_week: str
    completed_tasks: int
    total_tasks: int

class WeeklyReportDTO(BaseModel):
    id: str
    user_id: str
    start_week: str
    end_week: str
    completed_tasks: int
    total_tasks: int
    completion_percentage: float
    xp_earned: int
    level_reached: int
    trend: Literal["increasing", "stable", "decreasing"]

class TrendDataPoint(BaseModel):
    week: str
    completion_percentage: float
    xp_earned: int

class TrendAnalysis(BaseModel):
    avg_completion: float
    best_week: str
    worst_week: str

class TrendResponseDTO(BaseModel):
    user_id: str
    current_trend: Literal["increasing", "stable", "decreasing"]
    trend_data: List[TrendDataPoint]
    analysis: TrendAnalysis