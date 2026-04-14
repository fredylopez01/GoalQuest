from fastapi import APIRouter, Depends, Query
from app.db.redis import get_redis
from app.schemas.leaderboard import LeaderboardEntryDTO
from app.dependencies import get_current_user_id

router = APIRouter()

@router.get("/leaderboard", dependencies=[Depends(get_current_user_id)])
async def get_leaderboard(limit: int = Query(default=10, le=50)):
    r = get_redis()
    entries = await r.zrevrange("leaderboard:xp", 0, limit - 1, withscores=True)
    result = []
    for rank, (user_id, score) in enumerate(entries, start=1):
        profile = await r.hgetall(f"user:{user_id}:profile")
        result.append(LeaderboardEntryDTO(
            rank=rank,
            user_id=user_id,
            xp_total=int(score),
            current_level=int(profile.get("current_level", 1))
        ))
    return {"leaderboard": result}