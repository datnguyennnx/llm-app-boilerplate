from .ping import router as ping_router
from .websocket import router as websocket_router

routers = [
    ping_router,
    websocket_router
]