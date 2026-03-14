CREATE TABLE IF NOT EXISTS historical_events (

  event_id UUID PRIMARY KEY,

  event_name TEXT NOT NULL,

  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  duration_minutes INT NOT NULL,

  parent_event_id UUID,

  research_value INT,
  description TEXT,

  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_parent_event
    FOREIGN KEY(parent_event_id)
    REFERENCES historical_events(event_id)
    ON DELETE SET NULL

);

-- Indexes for performance

CREATE INDEX IF NOT EXISTS idx_parent_event
ON historical_events(parent_event_id);

CREATE INDEX IF NOT EXISTS idx_start_date
ON historical_events(start_date);

CREATE INDEX IF NOT EXISTS idx_end_date
ON historical_events(end_date);

CREATE INDEX IF NOT EXISTS idx_metadata
ON historical_events
USING GIN(metadata);

ALTER TABLE historical_events
DROP CONSTRAINT fk_parent_event;

ALTER TABLE historical_events
ADD CONSTRAINT fk_parent_event
FOREIGN KEY (parent_event_id)
REFERENCES historical_events(event_id)
DEFERRABLE INITIALLY DEFERRED;