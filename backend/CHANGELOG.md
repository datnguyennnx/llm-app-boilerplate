# Changelog

All notable changes to the backend will be documented in this file.

## [Unreleased]

### Removed

-   Caching for user sessions
-   Rate limiting middleware
-   Health check for external services

### Changed

-   Updated `middleware/auth.py` to remove caching
-   Modified `middleware/rate_limit.py` to use in-memory storage
-   Updated `routers/api/health.py` to only check database connection
-   Modified `routers/auth/google.py` to remove caching
-   Removed unnecessary dependencies from `requirements.txt`

### Optimized

-   Simplified backend by removing external caching dependency

## [1.0.0] - 2024-10-21 (Date of the last stable version before these changes)

### Initial Release

-   Basic FastAPI backend structure
-   Google OAuth integration
-   PostgreSQL database integration with SQLAlchemy
-   API endpoints for user authentication and data retrieval
