from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.cqrs import query_bus
from app.cqrs.queries.xp_history_queries import GetXpHistoryQuery
from app.dependencies import get_current_user_id

router = APIRouter()


@router.get("/xp-history/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_xp_history(
    user_id: str,
    source: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    page: int = Query(default=1),
    limit: int = Query(default=20),
):
    return await query_bus.dispatch(
        GetXpHistoryQuery(
            user_id=user_id,
            source=source,
            from_date=from_date,
            to_date=to_date,
            page=page,
            limit=limit,
        )
    )
