from typing import Optional
from app.cqrs.base import Query


class GetXpHistoryQuery(Query):
    user_id: str
    source: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    page: int = 1
    limit: int = 20
