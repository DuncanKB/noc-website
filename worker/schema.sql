-- The app-launch waitlist. One row per email address; nothing else is stored.
CREATE TABLE IF NOT EXISTS waitlist (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

-- "Routes near you" in the app: OpenStreetMap route lists per area (a 0.05°
-- grid square, activity and radius), kept 30 days. No user data.
CREATE TABLE IF NOT EXISTS route_cache (
  key TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);
