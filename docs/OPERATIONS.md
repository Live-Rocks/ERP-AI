# Operations

## Local deployment

1. Copy `.env.example` to `.env` and replace both values with long local secrets. Do not commit `.env`.
2. Ensure the required Ollama model is preloaded from an approved on-premise source; normal runtime must not fetch models or call cloud services.
3. Run `docker compose up --build -d` on the factory server.
4. Check `http://127.0.0.1:3000/api/health`, then sign in as the local admin and complete the dashboard flow.

## Data and recovery

- PostgreSQL uses the `postgres-data` named volume and initializes migrations only on first creation.
- Ollama uses the `ollama-data` named volume.
- Do not run `docker compose down -v` against a system containing valuable factory data without an approved backup and human authorization.

## Trust boundary

The Compose network is internal. Only the app binds to loopback; PostgreSQL and Ollama have no host ports. This product has no PLC control route and no cloud data dependency.
