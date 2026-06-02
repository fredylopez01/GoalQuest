from app.cqrs.base import Query


class GetLeaderboardQuery(Query):
    limit: int = 10
