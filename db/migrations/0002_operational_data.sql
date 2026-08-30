CREATE TABLE line_snapshots (
  line_id TEXT PRIMARY KEY,
  line_name TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('running', 'idle', 'stopped', 'fault')),
  produced_units INTEGER NOT NULL,
  rejected_units INTEGER NOT NULL,
  last_updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  line_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  opened_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX alerts_open_line_code_idx
  ON alerts (line_id, code)
  WHERE resolved_at IS NULL;

CREATE TABLE work_orders (
  id TEXT PRIMARY KEY,
  alert_id UUID NOT NULL UNIQUE REFERENCES alerts(id),
  line_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_assignment', 'in_progress', 'resolved')),
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE work_order_history (
  id UUID PRIMARY KEY,
  work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor_user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_assignment', 'in_progress', 'resolved')),
  note TEXT NOT NULL
);

CREATE INDEX work_order_history_order_idx ON work_order_history (work_order_id, occurred_at);
