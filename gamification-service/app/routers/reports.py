from fastapi import APIRouter, Depends, Query
from app.schemas.report import WeeklyReportRequestDTO
from app.services import report_service
from app.dependencies import verify_internal_key, get_current_user_id

router = APIRouter()

@router.post("/reports/weekly", status_code=201, dependencies=[Depends(verify_internal_key)])
async def generate_weekly_report(dto: WeeklyReportRequestDTO):
    return await report_service.generate_weekly_report(dto)

@router.get("/reports/weekly/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_weekly_reports(user_id: str, last: int = Query(default=4)):
    return {"reports": await report_service.get_weekly_reports(user_id, last)}

@router.get("/trends/{user_id}", dependencies=[Depends(get_current_user_id)])
async def get_trends(user_id: str, weeks: int = Query(default=4)):
    return await report_service.get_trends(user_id, weeks)