from app.cqrs.base import CommandHandler, QueryHandler
from app.cqrs.commands.achievement_commands import CreateAchievementCommand
from app.cqrs.queries.achievement_queries import (
    GetCatalogQuery,
    GetUserAchievementsQuery,
)
from app.schemas.achievement import AchievementDTO, CreateAchievementDTO
from app.services import achievement_service


class CreateAchievementHandler(
    CommandHandler[CreateAchievementCommand, AchievementDTO]
):
    async def handle(self, command: CreateAchievementCommand) -> AchievementDTO:
        dto = CreateAchievementDTO(**command.model_dump())
        return await achievement_service.create_achievement(dto)


class GetCatalogHandler(QueryHandler[GetCatalogQuery, list[AchievementDTO]]):
    async def handle(self, query: GetCatalogQuery) -> list[AchievementDTO]:
        return await achievement_service.get_catalog()


class GetUserAchievementsHandler(QueryHandler[GetUserAchievementsQuery, dict]):
    async def handle(self, query: GetUserAchievementsQuery) -> dict:
        return await achievement_service.get_user_achievements(
            query.user_id, query.unlocked
        )
