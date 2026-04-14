from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.mongodb import init_db
from app.db.redis import init_redis
from app.routers import profile, events, achievements, streak, leaderboard, reports, xp_history 


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await init_redis()
    yield

app = FastAPI(title="Gamification Service", lifespan=lifespan)

app.include_router(profile.router,       prefix="/gamification")
app.include_router(events.router,        prefix="/gamification")
app.include_router(achievements.router,  prefix="/gamification")
app.include_router(streak.router,        prefix="/gamification")
app.include_router(leaderboard.router,   prefix="/gamification")
app.include_router(reports.router,       prefix="/gamification")
app.include_router(xp_history.router, prefix="/gamification")