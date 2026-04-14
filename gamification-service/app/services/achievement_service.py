from app.models.achievement import Achievement
from app.models.user_achievement import UserAchievement
from app.schemas.achievement import AchievementDTO, UserAchievementDTO, LockedAchievementDTO, CreateAchievementDTO
from app.db.redis import get_redis
from fastapi import HTTPException

async def get_catalog() -> list[AchievementDTO]:
    achievements = await Achievement.find_all().to_list()
    return [AchievementDTO(id=str(a.id), code=a.code, name=a.name,
                           description=a.description, xp_reward=a.xp_reward)
            for a in achievements]

async def create_achievement(dto: CreateAchievementDTO) -> AchievementDTO:
    existing = await Achievement.find_one(Achievement.code == dto.code)
    if existing:
        raise HTTPException(status_code=409, detail={"statusCode": 409, "error": "CODE_EXISTS", "message": "Achievement code already exists"})
    ach = Achievement(**dto.model_dump())
    await ach.insert()
    return AchievementDTO(id=str(ach.id), code=ach.code, name=ach.name,
                          description=ach.description, xp_reward=ach.xp_reward)

async def get_user_achievements(user_id: str, unlocked_filter: bool | None = None):
    r = get_redis()
    all_achievements = await Achievement.find_all().to_list()
    user_achievements = await UserAchievement.find(UserAchievement.user_id == user_id).to_list()
    unlocked_map = {str(ua.achievement_id): ua for ua in user_achievements}

    # Leer progreso actual
    tasks_completed = int(await r.get(f"user:{user_id}:tasks_completed") or 0)
    streak_data = await r.hgetall(f"user:{user_id}:streak")
    consecutive_days = int(streak_data.get("consecutive_days", 0))
    profile = await r.hgetall(f"user:{user_id}:profile")
    current_level = int(profile.get("current_level", 1))

    unlocked_list = []
    locked_list = []

    for ach in all_achievements:
        ach_id = str(ach.id)
        if ach_id in unlocked_map:
            ua = unlocked_map[ach_id]
            unlocked_list.append(UserAchievementDTO(
                id=ach_id, code=ach.code, name=ach.name,
                description=ach.description, xp_reward=ach.xp_reward,
                rewarded_at=ua.rewarded_at.isoformat()
            ))
        else:
            progress_map = {
                "streak": consecutive_days,
                "tasks_completed": tasks_completed,
                "level": current_level
            }
            locked_list.append(LockedAchievementDTO(
                id=ach_id, code=ach.code, name=ach.name,
                description=ach.description, xp_reward=ach.xp_reward,
                progress=progress_map.get(ach.condition_type, 0),
                threshold=ach.threshold_value
            ))

    return {"unlocked": unlocked_list, "locked": locked_list}