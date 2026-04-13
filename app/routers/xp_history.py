from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.models.xp_history import XpHistory
from app.schemas.gamification import AchievementDTO
from pydantic import BaseModel
from app.dependencies import get_current_user_id

router = APIRouter()

class XpHistoryEntryDTO(BaseModel):
    id: str
    xp_awarded: int
    source: str
    source_id: str
    difficulty: Optional[str] = None
    streak_bonus: int
    created_at: str

@router.get("/xp-history/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_xp_history(
    user_id: str,
    source: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    page: int = Query(default=1),
    limit: int = Query(default=20)
):
    query = XpHistory.find(XpHistory.user_id == user_id)

    if source:
        query = XpHistory.find(XpHistory.user_id == user_id, XpHistory.source == source)

    if from_date:
        from datetime import datetime
        query = query.find(XpHistory.created_at >= datetime.fromisoformat(from_date))

    if to_date:
        from datetime import datetime
        query = query.find(XpHistory.created_at <= datetime.fromisoformat(to_date))

    total = await query.count()
    entries = await query.skip((page - 1) * limit).limit(limit).to_list()

    return {
        "data": [
            XpHistoryEntryDTO(
                id=str(e.id),
                xp_awarded=e.xp_awarded,
                source=e.source,
                source_id=e.source_id,
                difficulty=e.difficulty,
                streak_bonus=e.streak_bonus,
                created_at=e.created_at.isoformat()
            ) for e in entries
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total
        }
    }