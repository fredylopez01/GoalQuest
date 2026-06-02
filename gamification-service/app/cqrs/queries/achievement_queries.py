from typing import Optional
from app.cqrs.base import Query


class GetCatalogQuery(Query):
    pass


class GetUserAchievementsQuery(Query):
    user_id: str
    unlocked: Optional[bool] = None
