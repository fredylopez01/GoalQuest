from app.cqrs.base import CommandHandler
from app.cqrs.commands.gamification_commands import (
    ProcessTaskCompletedCommand,
    ProcessChallengeCompletedCommand,
)
from app.schemas.gamification import (
    TaskCompletedEventDTO,
    ChallengeCompletedEventDTO,
    GamificationResultDTO,
    ChallengeXpResultDTO,
)
from app.services import gamification_service


class ProcessTaskCompletedHandler(
    CommandHandler[ProcessTaskCompletedCommand, GamificationResultDTO]
):
    async def handle(
        self, command: ProcessTaskCompletedCommand
    ) -> GamificationResultDTO:
        dto = TaskCompletedEventDTO(**command.model_dump())
        return await gamification_service.process_task_completed(dto)


class ProcessChallengeCompletedHandler(
    CommandHandler[ProcessChallengeCompletedCommand, ChallengeXpResultDTO]
):
    async def handle(
        self, command: ProcessChallengeCompletedCommand
    ) -> ChallengeXpResultDTO:
        dto = ChallengeCompletedEventDTO(**command.model_dump())
        return await gamification_service.process_challenge_completed(dto)
