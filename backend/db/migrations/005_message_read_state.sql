-- Apply this migration to the working forum database for unread message badges.
-- This adds one table and does not alter existing rooms, conversations or messages.
CREATE TABLE IF NOT EXISTS message_read_state (
  user_id INT NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id INT NOT NULL,
  last_message_id INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
