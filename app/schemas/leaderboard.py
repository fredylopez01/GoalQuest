from pydantic import BaseModel
from typing import List

class LeaderboardEntryDTO(BaseModel):
    rank: int
    user_id: str
    xp_total: int
    current_level: int