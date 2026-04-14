from fastapi import Header, HTTPException
from app.config import settings

async def verify_internal_key(x_internal_service_key: str = Header(...)):
    if x_internal_service_key != settings.INTERNAL_SERVICE_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")

# Para endpoints con Bearer Token, el gateway ya validó el token.
# El user_id llegará como header X-User-Id inyectado por el gateway.
async def get_current_user_id(x_user_id: str = Header(...)) -> str:
    return x_user_id