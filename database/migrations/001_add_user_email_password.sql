BEGIN;

-- Add email and password_hash columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE users
  ADD CONSTRAINT users_email_unique UNIQUE (email);

COMMIT;