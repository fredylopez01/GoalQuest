from app.models.weekly_report import WeeklyReport
from app.models.xp_history import XpHistory
from app.db.redis import get_redis
from app.schemas.report import WeeklyReportRequestDTO, WeeklyReportDTO, TrendResponseDTO, TrendDataPoint, TrendAnalysis
from datetime import datetime, timezone
from fastapi import HTTPException

async def generate_weekly_report(dto: WeeklyReportRequestDTO) -> WeeklyReportDTO:
    r = get_redis()
    profile = await r.hgetall(f"user:{dto.user_id}:profile")
    level_reached = int(profile.get("current_level", 1))

    # XP ganado en el período
    start = datetime.fromisoformat(dto.start_week)
    end = datetime.fromisoformat(dto.end_week)
    xp_entries = await XpHistory.find(
        XpHistory.user_id == dto.user_id,
        XpHistory.created_at >= start,
        XpHistory.created_at <= end
    ).to_list()
    xp_earned = sum(e.xp_awarded for e in xp_entries)

    completion_percentage = round((dto.completed_tasks / dto.total_tasks * 100) if dto.total_tasks > 0 else 0.0, 2)

    # Calcular trend comparando con el reporte anterior
    previous = await WeeklyReport.find(
        WeeklyReport.user_id == dto.user_id
    ).sort(-WeeklyReport.created_at).limit(1).first_or_none()

    if previous:
        diff = completion_percentage - previous.completion_percentage
        trend = "increasing" if diff > 5 else ("decreasing" if diff < -5 else "stable")
    else:
        trend = "stable"

    report = WeeklyReport(
        user_id=dto.user_id,
        start_week=dto.start_week,
        end_week=dto.end_week,
        completed_tasks=dto.completed_tasks,
        total_tasks=dto.total_tasks,
        completion_percentage=completion_percentage,
        xp_earned=xp_earned,
        level_reached=level_reached,
        trend=trend,
        created_at=datetime.now(timezone.utc)
    )
    await report.insert()

    return WeeklyReportDTO(
        id=str(report.id), user_id=report.user_id,
        start_week=report.start_week, end_week=report.end_week,
        completed_tasks=report.completed_tasks, total_tasks=report.total_tasks,
        completion_percentage=report.completion_percentage, xp_earned=report.xp_earned,
        level_reached=report.level_reached, trend=report.trend
    )

async def get_weekly_reports(user_id: str, last: int = 4) -> list[WeeklyReportDTO]:
    reports = await WeeklyReport.find(
        WeeklyReport.user_id == user_id
    ).sort(-WeeklyReport.created_at).limit(last).to_list()
    return [WeeklyReportDTO(id=str(r.id), user_id=r.user_id, start_week=r.start_week,
                             end_week=r.end_week, completed_tasks=r.completed_tasks,
                             total_tasks=r.total_tasks, completion_percentage=r.completion_percentage,
                             xp_earned=r.xp_earned, level_reached=r.level_reached, trend=r.trend)
            for r in reports]

async def get_trends(user_id: str, weeks: int = 4) -> TrendResponseDTO:
    reports = await WeeklyReport.find(
        WeeklyReport.user_id == user_id
    ).sort(-WeeklyReport.created_at).limit(weeks).to_list()

    if not reports:
        raise HTTPException(status_code=404, detail={"statusCode": 404, "error": "NO_REPORTS", "message": "No reports found"})

    trend_data = [TrendDataPoint(week=r.start_week, completion_percentage=r.completion_percentage,
                                  xp_earned=r.xp_earned) for r in reports]
    percentages = [r.completion_percentage for r in reports]
    avg = round(sum(percentages) / len(percentages), 2)
    best = max(reports, key=lambda r: r.completion_percentage)
    worst = min(reports, key=lambda r: r.completion_percentage)

    return TrendResponseDTO(
        user_id=user_id,
        current_trend=reports[0].trend,
        trend_data=trend_data,
        analysis=TrendAnalysis(avg_completion=avg, best_week=best.start_week, worst_week=worst.start_week)
    )