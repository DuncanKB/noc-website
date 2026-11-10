-- The app-launch waitlist. One row per email address; nothing else is stored.
CREATE TABLE IF NOT EXISTS waitlist (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
