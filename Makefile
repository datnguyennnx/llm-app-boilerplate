up:
	docker compose up --build -d 

up-rebuild:
	docker compose up --build --force-recreate --no-deps

down:
	docker compose down

down-prune:
	docker compose down --volumes

.PHONY: up up-rebuild down down-prune
