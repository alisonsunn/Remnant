BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
);

CREATE TABLE IF NOT EXISTS moments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL,
  note TEXT,
  image_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moments_user_created_at
  ON moments (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS capsules (
  id BIGSERIAL PRIMARY KEY,
  moment_id BIGINT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  unlock_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlocked_at TIMESTAMPTZ,
  CONSTRAINT uq_capsules_moment UNIQUE (moment_id),
  CONSTRAINT chk_capsules_status CHECK (status IN ('locked', 'unlocked'))
);

CREATE INDEX IF NOT EXISTS idx_capsules_status_unlock_at
  ON capsules (status, unlock_at);

COMMIT;