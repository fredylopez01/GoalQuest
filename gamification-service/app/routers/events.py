from fastapi import APIRouter, Depends
from app.schemas.gamification import TaskCompletedEventDTO, ChallengeCompletedEventDTO
from app.services import gamification_service
from app.dependencies import verify_internal_key

router = APIRouter()

@router.post("/task-completed", dependencies=[Depends(verify_internal_key)])
async def task_completed(dto: TaskCompletedEventDTO):
    return await gamification_service.process_task_completed(dto)

@router.post("/challenge-completed", dependencies=[Depends(verify_internal_key)])
async def challenge_completed(dto: ChallengeCompletedEventDTO):
    return await gamification_service.process_challenge_completed(dto)