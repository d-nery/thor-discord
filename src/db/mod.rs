use serenity::prelude::TypeMapKey;
use sqlx::SqlitePool;

pub mod kv;
pub mod roles;

pub struct DbPool;

impl TypeMapKey for DbPool {
    type Value = SqlitePool;
}

