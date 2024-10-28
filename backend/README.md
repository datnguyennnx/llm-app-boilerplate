# Backend - LLM Chat Application

A FastAPI backend service for the LLM chat application, featuring OAuth authentication, real-time message streaming, and vector database integration.

## Tech Stack

-   **Framework:** FastAPI
-   **Language:** Python 3.10+
-   **Database:** PostgreSQL with pgvector
-   **ORM:** SQLAlchemy
-   **Migrations:** Alembic
-   **Authentication:** Google OAuth
-   **LLM Integration:** OpenAI API
-   **Real-time:** Server-Sent Events

## Quick Start

### Prerequisites

-   Docker and Docker Compose
-   Make utility

### Environment Setup

Create a `.env` file based on `.env_example`:

```bash
DATABASE_URL=postgresql://llm_user:llm_password@db:5432/llm-boilerplate
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key
```

### Docker Commands

```bash
# Start backend services
make up-backend

# Rebuild and start backend services
make up-backend-rebuild

# Stop backend services
make down-backend

# Start full stack (frontend + backend)
make up

# Stop all services
make down

# Remove volumes and stop services
make down-prune
```

## Database Management

### Initial Schema

The database includes the following core tables:

1. `users`:

    - `id` (UUID, primary key)
    - `email` (String, unique)
    - `hashed_password` (String)
    - `is_active` (Boolean)
    - `is_superuser` (Boolean)
    - `google_id` (String, unique)
    - `created_at` (DateTime)
    - `updated_at` (DateTime)

2. `sessions`:
    - `id` (UUID, primary key)
    - `user_id` (UUID, foreign key)
    - `session_token` (String, unique)
    - `expires_at` (DateTime)
    - `created_at` (DateTime)

### Migration Commands

```bash
# Apply all pending migrations
make migrate-up

# Revert last migration
make migrate-down

# Create new migration
make migrate-create name="describe_your_changes"
```

### Creating New Models

1. Define models in `models/models.py`:

```python
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid

class NewModel(Base):
    __tablename__ = "new_table"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

2. Create and apply migration:

```bash
make migrate-create name="add_new_table"
make migrate-up
```

## Project Structure

```
backend/
├── alembic/              # Database migrations
├── config/              # Configuration settings
├── core/               # Core business logic
│   ├── ask.py         # LLM integration
│   ├── helper/        # Helper functions
│   └── model_interface.py
├── database/          # Database configuration
├── middleware/        # API middleware
├── models/           # Database models
└── routers/          # API routes
    ├── api/          # API endpoints
    │   ├── chat/     # Chat-related endpoints
    │   ├── health.py
    │   └── ping.py
    └── auth/         # Authentication endpoints
```

## Development Guidelines

### Database Best Practices

1. Always review autogenerated migrations
2. Keep models up-to-date in `models/models.py`
3. Commit migration files to version control
4. Test migrations in non-production environment
5. Create new migrations instead of modifying existing ones
6. Use descriptive migration names

### Migration Troubleshooting

1. Check migration status:

```bash
docker compose exec db psql -U llm_user -d llm-boilerplate -c "\dt"
```

2. View table structure:

```bash
docker compose exec db psql -U llm_user -d llm-boilerplate -c "\d table_name"
```

3. For migration issues:
    - Check current migration state
    - Consider reverting to last known good state
    - Break complex changes into smaller migrations

## Docker Support

The application uses multi-stage builds for optimization:

1. Base stage: Sets up Python environment
2. Build stage: Installs dependencies
3. Run stage: Creates minimal production image

Key features:

-   Automatic migrations on startup
-   Health checks for database
-   Volume persistence for data
-   Network isolation

## Contributing

1. Follow Python best practices
2. Write unit tests
3. Update documentation
4. Create detailed PRs

## License

This project is proprietary and confidential.