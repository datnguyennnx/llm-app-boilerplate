from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import httpx
from database.database import get_db
from models.models import User, Session as DbSession

async def verify_google_token(token: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v3/tokeninfo",
            params={"access_token": token}
        )
        if response.status_code == 200:
            return response.json()
        return None

async def verify_token(token: str):
    db = next(get_db())
    try:
        # Verify the token with Google
        token_info = await verify_google_token(token)
        if token_info is None:
            return None

        # Check if the token exists in our database
        db_session = db.query(DbSession).filter(DbSession.access_token == token).first()
        if db_session is None:
            return None

        # Check if the token has expired
        if db_session.expires_at < datetime.now(timezone.utc):
            db.delete(db_session)
            db.commit()
            return None

        # Get the user associated with this session
        user = db.query(User).filter(User.id == db_session.user_id).first()
        if user is None:
            return None

        return user
    except Exception as e:
        return None

async def auth_middleware(request: Request, call_next):
    db = next(get_db())
    try:
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            token = token.split(' ')[1]
            user = await verify_token(token)
            if user is None:
                raise HTTPException(status_code=401, detail="Invalid authentication credentials")
            request.state.user = user
        else:
            request.state.user = None
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"detail": str(e.detail)})
    
    response = await call_next(request)
    return response