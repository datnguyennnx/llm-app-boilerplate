import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .api import routers as api_routers
from .auth import routers as auth_router
from .api.health import router as health_router
from middleware.auth import auth_middleware
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

def create_app():
    app = FastAPI()

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allows all origins
        allow_credentials=True,
        allow_methods=["*"],  # Allows all methods
        allow_headers=["*"],  # Allows all headers
    )

    # Define public routes that don't require authentication
    public_routes = ["/auth/login", "/auth/callback", "/health", "/ping"]

    # Include health check router
    app.include_router(health_router, prefix="/health", tags=["health"])

    # Include API routers with /api prefix
    for router in api_routers:
        app.include_router(router, prefix="/api", tags=["api"])

    # Include Google auth router
    for router in auth_router:
        app.include_router(router, prefix="/auth", tags=["auth"])

    @app.middleware("http")
    async def catch_exceptions_middleware(request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            logger.error(f"Unhandled exception: {str(e)}")
            return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

    @app.middleware("http")
    async def conditional_auth_middleware(request: Request, call_next):
        logger.info(f"Processing request for path: {request.url.path}")
        
        # Allow OPTIONS requests without authentication
        if request.method == "OPTIONS":
            logger.info(f"Allowing OPTIONS request for path: {request.url.path}")
            return await call_next(request)
        
        if request.url.path.startswith("/api") and request.url.path not in public_routes:
            logger.info(f"Applying auth middleware for path: {request.url.path}")
            return await auth_middleware(request, call_next)
        logger.info(f"Skipping auth middleware for path: {request.url.path}")
        return await call_next(request)

    return app
