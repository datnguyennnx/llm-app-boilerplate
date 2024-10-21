from .ping import router as ping_router
from .chat.chat_router import router as chat_router
from .chat.chat_history import router as chat_history_router
from .chat.conversation import router as conversation_router

routers = [
    ping_router,
    chat_router,
    chat_history_router,
    conversation_router
]
