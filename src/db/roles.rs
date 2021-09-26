use sqlx::{sqlite::SqliteQueryResult, Error, Pool, Sqlite};

#[derive(Debug, Clone)]
pub struct EmojiRole {
    pub eid: i64,
    pub rid: i64,
    pub description: String,
}

pub async fn get_all(pool: &Pool<Sqlite>) -> Result<Vec<EmojiRole>, Error> {
    sqlx::query_as!(EmojiRole, "SELECT * FROM roles").fetch_all(pool).await
}

pub async fn insert(pool: &Pool<Sqlite>, emoji_role: EmojiRole) -> Result<SqliteQueryResult, Error> {
    sqlx::query!(
        "INSERT OR REPLACE INTO roles(eid, rid, description) VALUES (?, ?, ?)",
        emoji_role.eid,
        emoji_role.rid,
        emoji_role.description,
    )
    .execute(pool)
    .await
}
