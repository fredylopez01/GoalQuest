from fastapi import APIRouter, Depends
from app.schemas.profile import CreateProfileDTO
from app.services import profile_service
from app.dependencies import verify_internal_key, get_current_user_id

router = APIRouter()

@router.post("/profile", status_code=201, dependencies=[Depends(verify_internal_key)])
async def create_profile(dto: CreateProfileDTO):
    return await profile_service.create_profile(dto)

@router.get("/profile/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_profile(user_id: str):
    return await profile_service.get_profile(user_id)