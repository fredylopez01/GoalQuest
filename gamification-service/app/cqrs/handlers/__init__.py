from app.cqrs import command_bus, query_bus

from app.cqrs.commands.profile_commands import CreateProfileCommand
from app.cqrs.commands.gamification_commands import (
    ProcessTaskCompletedCommand,
    ProcessChallengeCompletedCommand,
)
from app.cqrs.commands.streak_commands import CheckStreakResetCommand
from app.cqrs.commands.achievement_commands import CreateAchievementCommand
from app.cqrs.commands.report_commands import GenerateWeeklyReportCommand

from app.cqrs.queries.profile_queries import GetProfileQuery
from app.cqrs.queries.achievement_queries import (
    GetCatalogQuery,
    GetUserAchievementsQuery,
)
from app.cqrs.queries.streak_queries import GetStreakQuery
from app.cqrs.queries.leaderboard_queries import GetLeaderboardQuery
from app.cqrs.queries.xp_history_queries import GetXpHistoryQuery
from app.cqrs.queries.report_queries import GetWeeklyReportsQuery, GetTrendsQuery

from app.cqrs.handlers.profile_handlers import (
    CreateProfileHandler,
    GetProfileHandler,
)
from app.cqrs.handlers.gamification_handlers import (
    ProcessTaskCompletedHandler,
    ProcessChallengeCompletedHandler,
)
from app.cqrs.handlers.streak_handlers import (
    CheckStreakResetHandler,
    GetStreakHandler,
)
from app.cqrs.handlers.achievement_handlers import (
    CreateAchievementHandler,
    GetCatalogHandler,
    GetUserAchievementsHandler,
)
from app.cqrs.handlers.leaderboard_handlers import GetLeaderboardHandler
from app.cqrs.handlers.xp_history_handlers import GetXpHistoryHandler
from app.cqrs.handlers.report_handlers import (
    GenerateWeeklyReportHandler,
    GetWeeklyReportsHandler,
    GetTrendsHandler,
)


def register_handlers() -> None:
    """Registra todos los handlers en los buses. Llamar una sola vez al startup."""
    # Commands (escrituras)
    command_bus.register(CreateProfileCommand, CreateProfileHandler())
    command_bus.register(ProcessTaskCompletedCommand, ProcessTaskCompletedHandler())
    command_bus.register(
        ProcessChallengeCompletedCommand, ProcessChallengeCompletedHandler()
    )
    command_bus.register(CheckStreakResetCommand, CheckStreakResetHandler())
    command_bus.register(CreateAchievementCommand, CreateAchievementHandler())
    command_bus.register(GenerateWeeklyReportCommand, GenerateWeeklyReportHandler())

    # Queries (lecturas)
    query_bus.register(GetProfileQuery, GetProfileHandler())
    query_bus.register(GetCatalogQuery, GetCatalogHandler())
    query_bus.register(GetUserAchievementsQuery, GetUserAchievementsHandler())
    query_bus.register(GetStreakQuery, GetStreakHandler())
    query_bus.register(GetLeaderboardQuery, GetLeaderboardHandler())
    query_bus.register(GetXpHistoryQuery, GetXpHistoryHandler())
    query_bus.register(GetWeeklyReportsQuery, GetWeeklyReportsHandler())
    query_bus.register(GetTrendsQuery, GetTrendsHandler())
