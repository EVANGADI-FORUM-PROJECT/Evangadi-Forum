-- Apply after 001_password_recovery.sql; retains existing local passwords.
ALTER TABLE users
  MODIFY COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN google_id VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD UNIQUE KEY uniq_google_subject (google_id);
