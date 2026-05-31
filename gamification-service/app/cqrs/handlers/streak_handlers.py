from datetime import date, timedelta
from app.cqrs.base import CommandHandler, QueryHandler
from app.cqrs.commands.streak_commands import CheckStreakResetCommand
from app.cqrs.queries.streak_queries import GetStreakQuery
from app.db.redis import get_redis
from app.schemas.streak import StreakResponseDTO, CheckResetResponseDTO


class CheckStreakResetHandler(
    CommandHandler[CheckStreakResetCommand, CheckResetResponseDTO]
):
    async def handle(self, command: CheckStreakResetCommand) -> CheckResetResponseDTO:
        r = get_redis()
        reset_users: list[str] = []
        for user_id in command.user_ids:
            await r.hset(f"user:{user_id}:streak", "consecutive_days", 0)
            reset_users.append(user_id)
        return CheckResetResponseDTO(
            reset_count=len(reset_users), reset_users=reset_users
        )


class GetStreakHandler(QueryHandler[GetStreakQuery, StreakResponseDTO]):
    async def handle(self, query: GetStreakQuery) -> StreakResponseDTO:
        r = get_redis()
        data = await r.hgetall(f"user:{query.user_id}:streak")
        today = date.today().isoformat()
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        last_day = data.get("last_day", "")
        return StreakResponseDTO(
            user_id=query.user_id,
            consecutive_days=int(data.get("consecutive_days", 0)),
            max_streak=int(data.get("max_streak", 0)),
            last_day=last_day,
            streak_active=(last_day == today or last_day == yesterday),
        )
