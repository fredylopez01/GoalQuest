from datetime import datetime, timezone, date, timedelta
from app.db.redis import get_redis
from app.models.xp_history import XpHistory
from app.models.achievement import Achievement
from app.models.user_achievement import UserAchievement
from app.schemas.gamification import (
    TaskCompletedEventDTO, GamificationResultDTO,
    ChallengeCompletedEventDTO, ChallengeXpResultDTO,
    XpBreakdown, StreakResult, AchievementDTO
)

XP_MAP = {"easy": 10, "middle": 25, "high": 50}

def _calc_level(xp_total: int) -> int:
    return (xp_total // 100) + 1

async def _evaluate_achievements(user_id: str, consecutive_days: int, current_level: int) -> list:
    r = get_redis()
    tasks_completed = int(await r.get(f"user:{user_id}:tasks_completed") or 0)

    unlocked = await UserAchievement.find(UserAchievement.user_id == user_id).to_list()
    unlocked_ids = {str(u.achievement_id) for u in unlocked}

    all_achievements = await Achievement.find_all().to_list()
    new_ones = []

    for ach in all_achievements:
        if str(ach.id) in unlocked_ids:
            continue
        unlocked_now = False
        if ach.condition_type == "streak" and consecutive_days >= ach.threshold_value:
            unlocked_now = True
        elif ach.condition_type == "tasks_completed" and tasks_completed >= ach.threshold_value:
            unlocked_now = True
        elif ach.condition_type == "level" and current_level >= ach.threshold_value:
            unlocked_now = True

        if unlocked_now:
            await UserAchievement(
                user_id=user_id,
                achievement_id=ach.id,
                achievement_code=ach.code,
                rewarded_at=datetime.now(timezone.utc)
            ).insert()
            new_ones.append(ach)

    return new_ones

async def process_task_completed(dto: TaskCompletedEventDTO) -> GamificationResultDTO:
    r = get_redis()
    base_xp = XP_MAP[dto.difficulty]

    # Leer racha actual
    streak_data = await r.hgetall(f"user:{dto.user_id}:streak")
    consecutive_days = int(streak_data.get("consecutive_days", 0))
    last_day_str = streak_data.get("last_day", "")
    max_streak = int(streak_data.get("max_streak", 0))
    streak_increased = False
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    # Actualizar racha si se completaron todas las tareas del día
    if dto.all_daily_tasks_completed:
        if last_day_str == yesterday:
            consecutive_days += 1
            streak_increased = True
        elif last_day_str == today:
            pass
        else:
            consecutive_days = 1
            streak_increased = True
        max_streak = max(max_streak, consecutive_days)
        await r.hset(f"user:{dto.user_id}:streak", mapping={
            "consecutive_days": consecutive_days,
            "last_day": today,
            "max_streak": max_streak
        })

    streak_bonus = consecutive_days * 2
    await r.incr(f"user:{dto.user_id}:tasks_completed")

    # Leer XP actual
    profile = await r.hgetall(f"user:{dto.user_id}:profile")
    xp_total = int(profile.get("xp_total", 0))
    previous_level = _calc_level(xp_total)

    # Evaluar logros
    new_achievements = await _evaluate_achievements(dto.user_id, consecutive_days, previous_level)
    achievement_bonus = sum(a.xp_reward for a in new_achievements)

    # Calcular XP final
    xp_awarded = base_xp + streak_bonus + achievement_bonus
    xp_total += xp_awarded
    current_level = _calc_level(xp_total)
    leveled_up = current_level > previous_level

    # Actualizar Redis
    now = datetime.now(timezone.utc).isoformat()
    await r.hset(f"user:{dto.user_id}:profile", mapping={
        "xp_total": xp_total,
        "current_level": current_level,
        "updated_at": now
    })
    await r.zadd("leaderboard:xp", {dto.user_id: xp_total})

    # Guardar en MongoDB
    await XpHistory(
        user_id=dto.user_id,
        xp_awarded=xp_awarded,
        source="task_completion",
        source_id=str(dto.task_id),
        difficulty=dto.difficulty,
        streak_bonus=streak_bonus,
        created_at=datetime.now(timezone.utc)
    ).insert()

    return GamificationResultDTO(
        xp_awarded=xp_awarded,
        xp_breakdown=XpBreakdown(base=base_xp, streak_bonus=streak_bonus, achievement_bonus=achievement_bonus),
        total_xp=xp_total,
        current_level=current_level,
        previous_level=previous_level,
        leveled_up=leveled_up,
        streak=StreakResult(consecutive_days=consecutive_days, increased=streak_increased, max_streak=max_streak),
        new_achievements=[
            AchievementDTO(id=str(a.id), code=a.code, name=a.name,
                           description=a.description, xp_reward=a.xp_reward)
            for a in new_achievements
        ]
    )

async def process_challenge_completed(dto: ChallengeCompletedEventDTO) -> ChallengeXpResultDTO:
    r = get_redis()
    profile = await r.hgetall(f"user:{dto.user_id}:profile")
    xp_total = int(profile.get("xp_total", 0))
    previous_level = _calc_level(xp_total)

    xp_total += dto.xp_reward
    current_level = _calc_level(xp_total)
    leveled_up = current_level > previous_level

    now = datetime.now(timezone.utc).isoformat()
    await r.hset(f"user:{dto.user_id}:profile", mapping={
        "xp_total": xp_total,
        "current_level": current_level,
        "updated_at": now
    })
    await r.zadd("leaderboard:xp", {dto.user_id: xp_total})

    await XpHistory(
        user_id=dto.user_id,
        xp_awarded=dto.xp_reward,
        source="challenge_win",
        source_id=dto.challenge_id,
        difficulty=None,
        streak_bonus=0,
        created_at=datetime.now(timezone.utc)
    ).insert()

    streak_data = await r.hgetall(f"user:{dto.user_id}:streak")
    consecutive_days = int(streak_data.get("consecutive_days", 0))
    new_achievements = await _evaluate_achievements(dto.user_id, consecutive_days, current_level)

    return ChallengeXpResultDTO(
        xp_awarded=dto.xp_reward,
        total_xp=xp_total,
        current_level=current_level,
        leveled_up=leveled_up,
        new_achievements=[
            AchievementDTO(id=str(a.id), code=a.code, name=a.name,
                           description=a.description, xp_reward=a.xp_reward)
            for a in new_achievements
        ]
    )