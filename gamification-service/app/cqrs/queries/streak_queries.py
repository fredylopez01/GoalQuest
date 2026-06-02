from app.cqrs.base import Query


class GetStreakQuery(Query):
    user_id: str
