-- Add migration script here
CREATE TABLE IF NOT EXISTS KV (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS roles (
    eid INTEGER NOT NULL PRIMARY KEY,
    rid INTEGER NOT NULL,
    description TEXT NOT NULL
);
