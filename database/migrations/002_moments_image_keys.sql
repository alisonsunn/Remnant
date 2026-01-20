BEGIN;

-- Update image_key column to be an array of text
ALTER TABLE moments
  RENAME COLUMN image_key TO image_keys;

ALTER TABLE moments
  ALTER COLUMN image_keys TYPE TEXT[]
  USING CASE
    WHEN image_keys IS NULL THEN '{}'::text[]
    ELSE ARRAY[image_keys]
  END;

COMMIT;