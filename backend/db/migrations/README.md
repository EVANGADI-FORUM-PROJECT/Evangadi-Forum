# Database upgrades

Back up your database first. Existing installations apply each unapplied migration exactly once, in numeric order (001 through 007). Keep a record of applied migrations. Do not run schema.sql against an existing database: it drops tables.

001 and 002 retain the password recovery and Google identity changes from main. 003 adds avatars, saved questions and answer likes. 004 adds discussions and private conversations. 005 adds unread state. 006 adds attachments and message hiding. 007 adds notifications.

Fresh installations use schema.sql only; all migrations are already included. Never run the ALTER migrations again after creating the fresh schema.
