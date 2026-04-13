from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.schemas.achievement import CreateAchievementDTO
from app.services import achievement_service
from app.dependencies import get_current_user_id

router = APIRouter()

@router.get("/achievements/catalog", dependencies=[Depends(get_current_user_id)])
async def get_catalog():
    return {"achievements": await achievement_service.get_catalog()}

@router.post("/achievements", status_code=201, dependencies=[Depends(get_current_user_id)])
async def create_achievement(dto: CreateAchievementDTO):
    # El rol ADMIN lo debería verificar el gateway; acá lo dejamos para la dependencia si quieres
    return await achievement_service.create_achievement(dto)

@router.get("/achievements/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_user_achievements(user_id: str, unlocked: Optional[bool] = Query(None)):
    return await achievement_service.get_user_achievements(user_id, unlocked)