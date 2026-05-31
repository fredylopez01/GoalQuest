from datetime import datetime
from app.cqrs.base import QueryHandler
from app.cqrs.queries.xp_history_queries import GetXpHistoryQuery
from app.models.xp_history import XpHistory


class GetXpHistoryHandler(QueryHandler[GetXpHistoryQuery, dict]):
    async def handle(self, query: GetXpHistoryQuery) -> dict:
        q = XpHistory.find(XpHistory.user_id == query.user_id)

        if query.source:
            q = XpHistory.find(
                XpHistory.user_id == query.user_id,
                XpHistory.source == query.source,
            )

        if query.from_date:
            q = q.find(XpHistory.created_at >= datetime.fromisoformat(query.from_date))

        if query.to_date:
            q = q.find(XpHistory.created_at <= datetime.fromisoformat(query.to_date))

        total = await q.count()
        entries = await q.skip((query.page - 1) * query.limit).limit(query.limit).to_list()

        return {
            "data": [
                {
                    "id": str(e.id),
                    "xp_awarded": e.xp_awarded,
                    "source": e.source,
                    "source_id": e.source_id,
                    "difficulty": e.difficulty,
                    "streak_bonus": e.streak_bonus,
                    "created_at": e.created_at.isoformat(),
                }
                for e in entries
            ],
            "pagination": {
                "page": query.page,
                "limit": query.limit,
                "total": total,
            },
        }
