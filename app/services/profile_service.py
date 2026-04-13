from app.db.redis import get_redis
from app.models.user_achievement import UserAchievement
from app.models.achievement import Achievement
from app.schemas.profile import ProfileResponseDTO, CreateProfileDTO, StreakInfo
from datetime import datetime, timezone
from fastapi import HTTPException

def _calc_xp_to_next(xp_total: int) -> tuple[int, float]:
    current_level = (xp_total // 100) + 1
    xp_for_current = (current_level - 1) * 100
    xp_to_next = current_level * 100 - xp_total
    progress = ((xp_total - xp_for_current) / 100) * 100
    return xp_to_next, round(progress, 2)

async def create_profile(dto: CreateProfileDTO) -> dict:
    r = get_redis()
    profile_key = f"user:{dto.user_id}:profile"
    exists = await r.exists(profile_key)
    if exists:
        raise HTTPException(status_code=409, detail={"statusCode": 409, "error": "PROFILE_EXISTS", "message": "Profile already exists"})

    now = datetime.now(timezone.utc).isoformat()
    await r.hset(profile_key, mapping={"xp_total": 0, "current_level": 1, "updated_at": now})
    await r.hset(f"user:{dto.user_id}:streak", mapping={"consecutive_days": 0, "last_day": "", "max_streak": 0})
    await r.set(f"user:{dto.user_id}:tasks_completed", 0)
    await r.zadd("leaderboard:xp", {dto.user_id: 0})
    return {"user_id": dto.user_id, "xp_total": 0, "current_level": 1,
            "xp_to_next_level": 100, "xp_progress_percentage": 0.0,
            "streak": {"consecutive_days": 0, "max_streak": 0, "last_day": ""},
            "achievements_count": 0, "total_achievements": 0}

async def get_profile(user_id: str) -> ProfileResponseDTO:
    r = get_redis()
    profile = await r.hgetall(f"user:{user_id}:profile")
    if not profile:
        raise HTTPException(status_code=404, detail={"statusCode": 404, "error": "PROFILE_NOT_FOUND", "message": "Profile not found"})

    streak_data = await r.hgetall(f"user:{user_id}:streak")
    xp_total = int(profile.get("xp_total", 0))
    current_level = int(profile.get("current_level", 1))
    xp_to_next, progress_pct = _calc_xp_to_next(xp_total)

    achievements_count = await UserAchievement.find(UserAchievement.user_id == user_id).count()
    total_achievements = await Achievement.find_all().count()

    return ProfileResponseDTO(
        user_id=user_id,
        xp_total=xp_total,
        current_level=current_level,
        xp_to_next_level=xp_to_next,
        xp_progress_percentage=progress_pct,
        streak=StreakInfo(
            consecutive_days=int(streak_data.get("consecutive_days", 0)),
            max_streak=int(streak_data.get("max_streak", 0)),
            last_day=streak_data.get("last_day", ""),
        ),
        achievements_count=achievements_count,
        total_achievements=total_achievements,
    )