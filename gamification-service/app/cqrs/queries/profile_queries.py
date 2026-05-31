from app.cqrs.base import Query


class GetProfileQuery(Query):
    user_id: str
