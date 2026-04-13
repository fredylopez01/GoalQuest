from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.models.achievement import Achievement
from app.models.user_achievement import UserAchievement
from app.models.xp_history import XpHistory
from app.models.weekly_report import WeeklyReport

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB],
        document_models=[Achievement, UserAchievement, XpHistory, WeeklyReport]
    )