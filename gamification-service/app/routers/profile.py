from fastapi import APIRouter, Depends
from app.schemas.profile import CreateProfileDTO
from app.cqrs import command_bus, query_bus
from app.cqrs.commands.profile_commands import CreateProfileCommand
from app.cqrs.queries.profile_queries import GetProfileQuery
from app.dependencies import verify_internal_key, get_current_user_id

router = APIRouter()


@router.post("/profile", status_code=201, dependencies=[Depends(verify_internal_key)])
async def create_profile(dto: CreateProfileDTO):
    return await command_bus.dispatch(CreateProfileCommand(user_id=dto.user_id))


@router.get("/profile/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_profile(user_id: str):
    return await query_bus.dispatch(GetProfileQuery(user_id=user_id))
