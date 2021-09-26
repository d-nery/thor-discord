use sqlx::{sqlite::SqliteQueryResult, Error, Pool, Sqlite};

pub async fn set(pool: &Pool<Sqlite>, key: &str, val: String) -> Result<SqliteQueryResult, Error> {
    sqlx::query!("INSERT OR REPLACE INTO KV(key, value) VALUES (?, ?)", key, val,)
        .execute(pool)
        .await
}

pub async fn get(pool: &Pool<Sqlite>, key: &str) -> Result<String, Error> {
    match sqlx::query!("SELECT value FROM KV WHERE key = ?", key)
        .fetch_one(pool)
        .await
    {
        Ok(v) => return Ok(v.value),
        Err(e) => return Err(e),
    };
}
