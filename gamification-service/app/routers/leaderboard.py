from fastapi import APIRouter, Depends, Query
from app.cqrs import query_bus
from app.cqrs.queries.leaderboard_queries import GetLeaderboardQuery
from app.dependencies import get_current_user_id

router = APIRouter()


@router.get("/leaderboard", dependencies=[Depends(get_current_user_id)])
async def get_leaderboard(limit: int = Query(default=10, le=50)):
    return await query_bus.dispatch(GetLeaderboardQuery(limit=limit))
