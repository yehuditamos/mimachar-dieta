CREATE TABLE IF NOT EXISTS diet_groups (
  id uuid PRIMARY KEY,
  invite text NOT NULL UNIQUE CHECK (invite ~ '^[a-f0-9]{32}$'),
  state jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_shape CHECK (jsonb_typeof(state->'members')='array' AND jsonb_array_length(state->'members') BETWEEN 1 AND 4)
);
CREATE UNIQUE INDEX IF NOT EXISTS diet_groups_owner_unique ON diet_groups ((state->>'owner'));
CREATE INDEX IF NOT EXISTS diet_groups_members_idx ON diet_groups USING gin (state jsonb_path_ops);
ALTER TABLE diet_groups ENABLE ROW LEVEL SECURITY;
-- Server-only database access via the project role. No browser Data API or grants.
