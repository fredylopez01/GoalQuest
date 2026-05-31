from fastapi import APIRouter, Depends
from app.schemas.streak import CheckResetRequestDTO
from app.cqrs import command_bus, query_bus
from app.cqrs.commands.streak_commands import CheckStreakResetCommand
from app.cqrs.queries.streak_queries import GetStreakQuery
from app.dependencies import verify_internal_key, get_current_user_id

router = APIRouter()


@router.get("/streak/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_streak(user_id: str):
    return await query_bus.dispatch(GetStreakQuery(user_id=user_id))


@router.post("/streak/check-reset", dependencies=[Depends(verify_internal_key)])
async def check_streak_reset(dto: CheckResetRequestDTO):
    return await command_bus.dispatch(CheckStreakResetCommand(user_ids=dto.user_ids))
