from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx
import logging
import uuid

from config.settings import settings
from database.database import get_db
from models.models import User, Session as DbSession

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
logger = logging.getLogger(__name__)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

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
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # Create a new session
        session = DbSession(
            user_id=user.id,
            session_token=str(uuid.uuid4()),
            expires_at=datetime.now(timezone.utc) + access_token_expires
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        logger.info(f"Created new session for user: {user.email}")
        
        redirect_url = f"{settings.FRONTEND_URL}/login?access_token={access_token}&session_token={session.session_token}"
        logger.info(f"Redirecting to: {redirect_url}")
        return RedirectResponse(url=redirect_url)
    except ValueError as e:
        logger.error(f"Invalid Google token: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid Google token")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = {"email": email}
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == token_data["email"]).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/user")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user