from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import routers as api_routers
from .auth import routers as auth_router

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

    # Include API routers
    for router in api_routers:
        app.include_router(router)

    # Include Google auth router
    for router in auth_router:
        app.include_router(router, prefix="/auth", tags=["auth"])

    return app