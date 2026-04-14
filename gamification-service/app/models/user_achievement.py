from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime

class UserAchievement(Document):
    user_id: str
    achievement_id: PydanticObjectId
    achievement_code: str
    rewarded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "user_achievements"