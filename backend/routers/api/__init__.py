from .ping import router as ping_router
from .health import router as health_router
from .chat.chat import router as chat_router

routers = [
    ping_router,
    health_router,
    chat_router
]
