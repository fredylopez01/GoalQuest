from app.cqrs.base import CommandHandler, QueryHandler
from app.cqrs.commands.report_commands import GenerateWeeklyReportCommand
from app.cqrs.queries.report_queries import GetWeeklyReportsQuery, GetTrendsQuery
from app.schemas.report import (
    WeeklyReportRequestDTO,
    WeeklyReportDTO,
    TrendResponseDTO,
)
from app.services import report_service


class GenerateWeeklyReportHandler(
    CommandHandler[GenerateWeeklyReportCommand, WeeklyReportDTO]
):
    async def handle(
        self, command: GenerateWeeklyReportCommand
    ) -> WeeklyReportDTO:
        dto = WeeklyReportRequestDTO(**command.model_dump())
        return await report_service.generate_weekly_report(dto)


class GetWeeklyReportsHandler(
    QueryHandler[GetWeeklyReportsQuery, list[WeeklyReportDTO]]
):
    async def handle(
        self, query: GetWeeklyReportsQuery
    ) -> list[WeeklyReportDTO]:
        return await report_service.get_weekly_reports(query.user_id, query.last)


class GetTrendsHandler(QueryHandler[GetTrendsQuery, TrendResponseDTO]):
    async def handle(self, query: GetTrendsQuery) -> TrendResponseDTO:
        return await report_service.get_trends(query.user_id, query.weeks)
