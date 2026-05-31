from fastapi import APIRouter, Depends
from app.schemas.gamification import TaskCompletedEventDTO, ChallengeCompletedEventDTO
from app.cqrs import command_bus
from app.cqrs.commands.gamification_commands import (
    ProcessTaskCompletedCommand,
    ProcessChallengeCompletedCommand,
)
from app.dependencies import verify_internal_key

router = APIRouter()


@router.post("/task-completed", dependencies=[Depends(verify_internal_key)])
async def task_completed(dto: TaskCompletedEventDTO):
    return await command_bus.dispatch(ProcessTaskCompletedCommand(**dto.model_dump()))


@router.post("/challenge-completed", dependencies=[Depends(verify_internal_key)])
async def challenge_completed(dto: ChallengeCompletedEventDTO):
    return await command_bus.dispatch(
        ProcessChallengeCompletedCommand(**dto.model_dump())
    )
