CREATE TABLE quality_records (
  id UUID PRIMARY KEY,
  production_task_id UUID NOT NULL REFERENCES production_tasks(id) ON DELETE RESTRICT,
  line_id TEXT NOT NULL,
  batch_or_serial TEXT NOT NULL,
  inspection_result TEXT NOT NULL CHECK (inspection_result IN ('pass', 'fail')),
  defect_description TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'corrected', 'closed')),
  corrective_action TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (production_task_id, batch_or_serial),
  CHECK ((inspection_result = 'fail' AND defect_description IS NOT NULL) OR (inspection_result = 'pass' AND defect_description IS NULL)),
  CHECK ((inspection_result = 'fail' AND status IN ('open', 'corrected', 'closed')) OR (inspection_result = 'pass' AND status = 'closed'))
);

CREATE INDEX quality_records_batch_or_serial_idx ON quality_records (batch_or_serial, updated_at DESC);
CREATE INDEX quality_records_task_idx ON quality_records (production_task_id, updated_at DESC);

CREATE TABLE quality_record_history (
  id UUID PRIMARY KEY,
  quality_record_id UUID NOT NULL REFERENCES quality_records(id) ON DELETE RESTRICT,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('open', 'corrected', 'closed')),
  note TEXT NOT NULL
);

CREATE INDEX quality_record_history_record_idx ON quality_record_history (quality_record_id, occurred_at);
