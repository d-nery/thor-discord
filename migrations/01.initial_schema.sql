CREATE TABLE IF NOT EXISTS KV (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS custom_commands (
    gid TEXT NOT NULL,
    cmd TEXT NOT NULL,
    output TEXT NOT NULL,
    PRIMARY KEY (gid, cmd)
);
