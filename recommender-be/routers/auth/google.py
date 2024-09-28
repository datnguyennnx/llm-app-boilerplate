from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime, timedelta, timezone
import httpx
import logging

from config.settings import settings
from database.database import get_db
from models.models import User, Session as DbSession

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/login")
async def login_google():
    return {
        "url": f"https://accounts.google.com/o/oauth2/auth?response_type=code&client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={settings.GOOGLE_REDIRECT_URI}&scope=openid%20profile%20email&access_type=offline"
    }

@router.get("/callback")
async def auth_google(code: str, db: Session = Depends(get_db)):
    logger.info("Google callback received")
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
    
    if response.status_code != 200:
        logger.error(f"Failed to get access token: {response.text}")
        raise HTTPException(status_code=400, detail="Failed to get access token")
    
    token_data = response.json()
    access_token = token_data["access_token"]
    
    try:
        idinfo = id_token.verify_oauth2_token(token_data["id_token"], requests.Request(), settings.GOOGLE_CLIENT_ID)
        
        user = db.query(User).filter(User.email == idinfo["email"]).first()
        if not user:
            logger.info(f"Creating new user: {idinfo['email']}")
            user = User(email=idinfo["email"], google_id=idinfo["sub"])
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            logger.info(f"Existing user logged in: {idinfo['email']}")
        
        # Create a new session with the Google access token
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data["expires_in"])
        session = DbSession(
            user_id=user.id,
            access_token=access_token,
            expires_at=expires_at
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        logger.info(f"Created new session for user: {user.email}")
        
        redirect_url = f"{settings.FRONTEND_URL}/callback?access_token={access_token}"
        logger.info(f"Redirecting to: {redirect_url}")
        return RedirectResponse(url=redirect_url)
    except ValueError as e:
        logger.error(f"Invalid Google token: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid Google token")

@router.get("/user")
async def read_users_me(request: Request):
    return request.state.user