CREATE TABLE production_tasks (
  id UUID PRIMARY KEY,
  line_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'paused', 'completed')),
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  good_units INTEGER NOT NULL DEFAULT 0 CHECK (good_units >= 0),
  rejected_units INTEGER NOT NULL DEFAULT 0 CHECK (rejected_units >= 0),
  downtime_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX production_tasks_line_status_idx ON production_tasks (line_id, status);
CREATE INDEX production_tasks_assignee_status_idx ON production_tasks (assigned_to_user_id, status);

CREATE TABLE production_task_history (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES production_tasks(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'paused', 'completed')),
  good_units INTEGER NOT NULL DEFAULT 0 CHECK (good_units >= 0),
  rejected_units INTEGER NOT NULL DEFAULT 0 CHECK (rejected_units >= 0),
  downtime_reason TEXT,
  note TEXT NOT NULL
);

CREATE INDEX production_task_history_task_idx ON production_task_history (task_id, occurred_at);
