up:
	docker compose up --build -d 

up-rebuild:
	docker compose up --build --force-recreate --no-deps

down:
	docker compose down

down-prune:
	docker compose down --volumes

up-backend:
	docker compose -f docker-compose.backend.yml up --build

up-backend-rebuild:
	docker compose -f docker-compose.backend.yml up --build --force-recreate --no-deps

down-backend:
	docker compose -f docker-compose.backend.yml down

migrate-up:
	docker compose -f docker-compose.backend.yml run --rm backend alembic upgrade head

migrate-down:
	docker compose -f docker-compose.backend.yml run --rm backend alembic downgrade -1

migrate-create:
	docker compose -f docker-compose.backend.yml run --rm backend alembic revision --autogenerate -m "$(name)"

.PHONY: up up-rebuild down down-prune up-backend up-backend-rebuild down-backend migrate-up migrate-down migrate-create
