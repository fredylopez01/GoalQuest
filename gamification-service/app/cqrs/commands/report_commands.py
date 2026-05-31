from app.cqrs.base import Command


class GenerateWeeklyReportCommand(Command):
    user_id: str
    start_week: str
    end_week: str
    completed_tasks: int
    total_tasks: int
