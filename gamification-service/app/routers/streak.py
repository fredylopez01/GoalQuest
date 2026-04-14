from fastapi import APIRouter, Depends
from datetime import date
from app.db.redis import get_redis
from app.schemas.streak import StreakResponseDTO, CheckResetRequestDTO, CheckResetResponseDTO
from app.dependencies import verify_internal_key, get_current_user_id

router = APIRouter()

@router.get("/streak/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_streak(user_id: str):
    r = get_redis()
    data = await r.hgetall(f"user:{user_id}:streak")
    today = date.today().isoformat()
    yesterday = (date.today().replace(day=date.today().day - 1)).isoformat()
    last_day = data.get("last_day", "")
    return StreakResponseDTO(
        user_id=user_id,
        consecutive_days=int(data.get("consecutive_days", 0)),
        max_streak=int(data.get("max_streak", 0)),
        last_day=last_day,
        streak_active=(last_day == today or last_day == yesterday)
    )

@router.post("/streak/check-reset", dependencies=[Depends(verify_internal_key)])
async def check_streak_reset(dto: CheckResetRequestDTO):
    r = get_redis()
    reset_users = []
    for user_id in dto.user_ids:
        await r.hset(f"user:{user_id}:streak", "consecutive_days", 0)
        reset_users.append(user_id)
    return CheckResetResponseDTO(reset_count=len(reset_users), reset_users=reset_users)