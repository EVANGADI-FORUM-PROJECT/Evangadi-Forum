-- Apply once to an existing database. No user data is dropped.
ALTER TABLE users
  ADD COLUMN reset_token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD COLUMN reset_token_expires DATETIME NULL,
  ADD COLUMN reset_requested_at DATETIME NULL,
  ADD COLUMN auth_version INT UNSIGNED NOT NULL DEFAULT 0,
  ADD UNIQUE KEY uniq_reset_token_hash (reset_token_hash);
