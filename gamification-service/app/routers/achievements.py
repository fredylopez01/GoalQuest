from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.schemas.achievement import CreateAchievementDTO
from app.cqrs import command_bus, query_bus
from app.cqrs.commands.achievement_commands import CreateAchievementCommand
from app.cqrs.queries.achievement_queries import (
    GetCatalogQuery,
    GetUserAchievementsQuery,
)
from app.dependencies import get_current_user_id

router = APIRouter()


@router.get("/achievements/catalog", dependencies=[Depends(get_current_user_id)])
async def get_catalog():
    return {"achievements": await query_bus.dispatch(GetCatalogQuery())}


@router.post("/achievements", status_code=201, dependencies=[Depends(get_current_user_id)])
async def create_achievement(dto: CreateAchievementDTO):
    return await command_bus.dispatch(CreateAchievementCommand(**dto.model_dump()))


@router.get("/achievements/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_user_achievements(user_id: str, unlocked: Optional[bool] = Query(None)):
    return await query_bus.dispatch(
        GetUserAchievementsQuery(user_id=user_id, unlocked=unlocked)
    )
