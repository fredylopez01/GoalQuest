from app.cqrs.base import Query


class GetWeeklyReportsQuery(Query):
    user_id: str
    last: int = 4


class GetTrendsQuery(Query):
    user_id: str
    weeks: int = 4
