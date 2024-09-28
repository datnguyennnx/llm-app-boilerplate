from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import routers as api_routers
from .auth import routers as auth_router
from middleware.auth import auth_middleware

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

    # Add authentication middleware
    app.middleware("http")(auth_middleware)

    # Include API routers with /api prefix
    for router in api_routers:
        app.include_router(router, prefix="/api", tags=["api"])

    # Include Google auth router
    for router in auth_router:
        app.include_router(router, prefix="/auth", tags=["auth"])

    return app