import logging
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import httpx
from database.database import get_db
from models.models import User, Session as DbSession
from cachetools import TTLCache
from functools import lru_cache

logger = logging.getLogger(__name__)

# Create a cache with a 5-minute TTL and a maximum of 1000 items
token_cache = TTLCache(maxsize=1000, ttl=300)

# List of paths that don't require authentication
PUBLIC_PATHS = ['/auth/login', '/auth/callback', '/health', '/ping']

async def verify_google_token(token: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/tokeninfo",
                params={"access_token": token}
            )
            if response.status_code == 200:
                token_info = response.json()
                return token_info
            logger.warning(f"Google token verification failed. Response: {response.text}")
            return None
        except Exception as e:
            logger.error(f"Error verifying Google token: {str(e)}")
            return None

@lru_cache(maxsize=1)
def get_db_session():
    return next(get_db())

async def verify_token(token: str):
    logger.info(f"Verifying token: {token[:10]}...")  # Log first 10 characters of token
    # Check if the token is in the cache
    cached_user = token_cache.get(token)
    if cached_user:
        return cached_user, None

    db = get_db_session()
    try:
        # Verify the token with Google
        token_info = await verify_google_token(token)
        if token_info is None:
            logger.warning("Token verification with Google failed")
            return None, "Invalid Google token"

        # Check if the token exists in our database
        db_session = db.query(DbSession).filter(DbSession.access_token == token).first()
        if db_session is None:
            logger.warning("Token not found in database")
            return None, "Token not found in database"

        # Check if the token has expired
        if db_session.expires_at < datetime.now(timezone.utc):
            logger.warning(f"Token has expired. Expiry: {db_session.expires_at}")
            db.delete(db_session)
            db.commit()
            return None, "Token has expired"

        # Get the user associated with this session
        user = db.query(User).filter(User.id == db_session.user_id).first()
        if user is None:
            logger.warning(f"User not found for session id: {db_session.id}")
            return None, "User not found"

        # Cache the user object
        token_cache[token] = user
        return user, None
    except Exception as e:
        logger.error(f"Error in verify_token: {str(e)}")
        return None, f"Internal server error: {str(e)}"

async def auth_middleware(request: Request, call_next):

    # Check if the path requires authentication
    if request.url.path in PUBLIC_PATHS:
        logger.info(f"Skipping authentication for public path: {request.url.path}")
        return await call_next(request)

    try:
        auth_header = request.headers.get('Authorization')
        logger.info(f"Authorization header: {auth_header[:15]}..." if auth_header else "No Authorization header")
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user, error = await verify_token(token)
            if user is None:
                logger.warning(f"Authentication failed: {error}")
                return JSONResponse(status_code=401, content={"detail": f"Invalid authentication credentials: {error}"})
            request.state.user = user
            logger.info(f"User authenticated: {user.email}")
        else:
            logger.warning("No valid Authorization header provided")
            return JSONResponse(status_code=401, content={"detail": "No valid Authorization header provided"})

        # Check for X-HTTP-Method header and store in request state if present
        x_http_method = request.headers.get('X-HTTP-Method')
        if x_http_method:
            request.state.custom_method = x_http_method.upper()
            logger.info(f"Custom method stored in request state: {x_http_method}")

        response = await call_next(request)
        logger.info(f"Request completed. Status code: {response.status_code}")
        return response

    except Exception as e:
        logger.error(f"Error in auth_middleware: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": f"Internal server error: {str(e)}"})
