from app.cqrs.base import QueryHandler
from app.cqrs.queries.leaderboard_queries import GetLeaderboardQuery
from app.db.redis import get_redis
from app.schemas.leaderboard import LeaderboardEntryDTO


class GetLeaderboardHandler(QueryHandler[GetLeaderboardQuery, dict]):
    async def handle(self, query: GetLeaderboardQuery) -> dict:
        r = get_redis()
        entries = await r.zrevrange(
            "leaderboard:xp", 0, query.limit - 1, withscores=True
        )
        result: list[LeaderboardEntryDTO] = []
        for rank, (user_id, score) in enumerate(entries, start=1):
            profile = await r.hgetall(f"user:{user_id}:profile")
            result.append(
                LeaderboardEntryDTO(
                    rank=rank,
                    user_id=user_id,
                    xp_total=int(score),
                    current_level=int(profile.get("current_level", 1)),
                )
            )
        return {"leaderboard": result}
