from app.cqrs.base import CommandHandler, QueryHandler
from app.cqrs.commands.profile_commands import CreateProfileCommand
from app.cqrs.queries.profile_queries import GetProfileQuery
from app.schemas.profile import CreateProfileDTO, ProfileResponseDTO
from app.services import profile_service


class CreateProfileHandler(CommandHandler[CreateProfileCommand, dict]):
    async def handle(self, command: CreateProfileCommand) -> dict:
        dto = CreateProfileDTO(user_id=command.user_id)
        return await profile_service.create_profile(dto)


class GetProfileHandler(QueryHandler[GetProfileQuery, ProfileResponseDTO]):
    async def handle(self, query: GetProfileQuery) -> ProfileResponseDTO:
        return await profile_service.get_profile(query.user_id)
