-- Apply once to a database where discussion rooms, private chat and badges work.
-- Existing messages are preserved as text messages.
ALTER TABLE discussion_messages
  ADD COLUMN message_type VARCHAR(20) NOT NULL DEFAULT 'text',
  ADD COLUMN attachment_path VARCHAR(255) NULL,
  ADD COLUMN attachment_name VARCHAR(255) NULL,
  ADD COLUMN attachment_mime VARCHAR(120) NULL,
  ADD COLUMN attachment_size INT NULL,
  ADD COLUMN duration_seconds INT NULL,
  ADD COLUMN deleted_for_everyone TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE private_messages
  ADD COLUMN message_type VARCHAR(20) NOT NULL DEFAULT 'text',
  ADD COLUMN attachment_path VARCHAR(255) NULL,
  ADD COLUMN attachment_name VARCHAR(255) NULL,
  ADD COLUMN attachment_mime VARCHAR(120) NULL,
  ADD COLUMN attachment_size INT NULL,
  ADD COLUMN duration_seconds INT NULL,
  ADD COLUMN deleted_for_everyone TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS message_hidden (
  user_id INT NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  message_id INT NOT NULL,
  PRIMARY KEY (user_id, target_type, message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
