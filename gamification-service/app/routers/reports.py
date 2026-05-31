from fastapi import APIRouter, Depends, Query
from app.schemas.report import WeeklyReportRequestDTO
from app.cqrs import command_bus, query_bus
from app.cqrs.commands.report_commands import GenerateWeeklyReportCommand
from app.cqrs.queries.report_queries import GetWeeklyReportsQuery, GetTrendsQuery
from app.dependencies import verify_internal_key, get_current_user_id

router = APIRouter()


@router.post("/reports/weekly", status_code=201, dependencies=[Depends(verify_internal_key)])
async def generate_weekly_report(dto: WeeklyReportRequestDTO):
    return await command_bus.dispatch(GenerateWeeklyReportCommand(**dto.model_dump()))


@router.get("/reports/weekly/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_weekly_reports(user_id: str, last: int = Query(default=4)):
    return {
        "reports": await query_bus.dispatch(
            GetWeeklyReportsQuery(user_id=user_id, last=last)
        )
    }


@router.get("/trends/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_trends(user_id: str, weeks: int = Query(default=4)):
    return await query_bus.dispatch(GetTrendsQuery(user_id=user_id, weeks=weeks))
