import os
import logging
from routers.main import create_app
from database.database import engine
from models.models import Base

# Set up logging
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)
logger.info(f"Logging level set to {log_level}")

# Create database tables
Base.metadata.create_all(bind=engine)
logger.info("Database tables created")

app = create_app()
app.title = "Backend Recommender"
app.debug = False

logger.info("Application startup complete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level=log_level.lower())