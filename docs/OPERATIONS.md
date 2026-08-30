# Operations

## Local deployment

1. Copy `.env.example` to `.env`, replace all passwords, and set the exact preloaded `OLLAMA_MODEL` name. Do not commit `.env`; the two initial passwords are only used to create the first local accounts when an empty PostgreSQL volume starts.
2. Ensure the required Ollama model is preloaded into the local `ollama-data` volume (or a private on-premise image mirror) from an approved on-premise source; normal runtime must not fetch models or call cloud services.
3. Run `docker compose up --build -d` on the factory server.
4. Check `http://127.0.0.1:3000/api/health`, then sign in as the local admin and complete the dashboard flow.

## Data and recovery

- PostgreSQL uses the `postgres-data` named volume and initializes migrations only on first creation. Users, audit events, five-line snapshots, alerts, work orders, work-order histories, manual production tasks (`production_tasks`), production-task histories (`production_task_history`), quality records (`quality_records`), and quality-record histories (`quality_record_history`) are persisted there.
- Ollama uses the `ollama-data` named volume.
- Do not run `docker compose down -v` against a system containing valuable factory data without an approved backup and human authorization.

### Manual logical backup

Use an approved, access-controlled on-premise host directory for backups. The following is an operator procedure, not an automated backup service; retention and storage controls remain the responsibility of factory IT and the quality owner.

```bash
FACTORY_BACKUP_DIR=/approved/on-premise/erp-backups
test -d "$FACTORY_BACKUP_DIR"
docker compose exec -T postgres pg_dump -U erp -d erp -Fc > "$FACTORY_BACKUP_DIR/erp-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Record the resulting file name, time, operator, and the application version with the approved backup record. Do not copy the dump to cloud storage or an unapproved external location.

### Isolated restore exercise

Restore testing must target an isolated recovery database or a new recovery volume, never the active `erp` database. With an approved backup file selected, an operator may create a separate `erp_recovery` database and restore the custom-format dump into it:

```bash
docker compose exec -T postgres createdb -U erp erp_recovery
cat "$FACTORY_BACKUP_DIR/<approved-backup>.dump" | docker compose exec -T postgres pg_restore -U erp -d erp_recovery --no-owner
```

Verify the recovery database while the application continues using `erp`. Restoring over the running production database is destructive: it requires explicit human authorization, a fresh backup of the current data, an approved maintenance window, and a separately reviewed recovery runbook. This document does not authorize or automate that operation.

### Existing-volume migration upgrade

The PostgreSQL image runs `/docker-entrypoint-initdb.d` only when `postgres-data` is first created. An existing volume therefore does not automatically receive newly added migration files.

1. Create and record a logical backup first.
2. Inspect the known relation markers before making any change:

   ```bash
   docker compose exec -T postgres psql -U erp -d erp -Atc "SELECT to_regclass('public.line_snapshots'), to_regclass('public.production_tasks'), to_regclass('public.quality_records');"
   ```

3. Determine the exact missing migration from the relation check: `line_snapshots` is created by `0002_operational_data.sql`, `production_tasks` by `0003_production_execution.sql`, and `quality_records` by `0004_quality_traceability.sql`. Apply only an approved, missing migration, in numeric order, with `ON_ERROR_STOP` enabled; for example:

   ```bash
   docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U erp -d erp -f /docker-entrypoint-initdb.d/0004_quality_traceability.sql
   ```

Never rerun all migration files against an existing volume. Stop and investigate unexpected relation states or a failed migration before retrying; do not delete the volume as a repair step.

These Docker, backup, restore, and migration procedures are documented but have not been system-verified in this workspace because Docker CLI is unavailable.

## Trust boundary

The Compose network is internal. Only the app binds to loopback; PostgreSQL and Ollama have no host ports. This product has no PLC control route and no cloud data dependency.
