use std::collections::HashMap;

use crate::db::{self, DbPool};

use serenity::{
    model::{
        channel::{Reaction, ReactionType},
        id::UserId,
    },
    prelude::*,
};
use tracing::info;

pub async fn reaction_add(ctx: &Context, reaction: Reaction) {
    // Ignore the bot
    if &reaction.user_id.unwrap_or(UserId(0)).0 == ctx.cache.current_user().await.id.as_u64() {
        return;
    }

    let msg_id = reaction.message_id.0;

    let pool = {
        let data_read = ctx.data.read().await;
        data_read.get::<DbPool>().unwrap().clone()
    };

    let mid = db::kv::get(&pool, "roles/mid")
        .await
        .unwrap_or("0".into())
        .parse::<u64>()
        .unwrap_or(0);

    info!("Reaction received on message {}", msg_id);

    if msg_id != mid {
        return;
    }

    info!("Role reaction added by {:?}", reaction.user_id);

    let emoji_roles: HashMap<u64, u64> = db::roles::get_all(&pool)
        .await
        .unwrap()
        .into_iter()
        .map(|e| (e.eid as u64, e.rid as u64))
        .collect();

    match reaction.emoji {
        ReactionType::Custom { id, .. } => {
            if !emoji_roles.contains_key(&id.0) {
                ctx.http
                    .delete_reaction(
                        reaction.channel_id.0,
                        mid,
                        Some(reaction.user_id.unwrap().0),
                        &reaction.emoji,
                    )
                    .await
                    .unwrap();
            }

            ctx.http
                .add_member_role(
                    reaction.guild_id.unwrap().0,
                    reaction.user_id.unwrap().0,
                    *emoji_roles.get(&id.0).unwrap(),
                )
                .await
                .unwrap();
        }
        _ => {
            ctx.http
                .delete_reaction(
                    reaction.channel_id.0,
                    mid,
                    Some(reaction.user_id.unwrap().0),
                    &reaction.emoji,
                )
                .await
                .unwrap();
        }
    }
}

pub async fn reaction_remove(ctx: &Context, reaction: Reaction) {
    // Ignore the bot
    if &reaction.user_id.unwrap_or(UserId(0)).0 == ctx.cache.current_user().await.id.as_u64() {
        return;
    }

    let msg_id = reaction.message_id.0;

    let pool = {
        let data_read = ctx.data.read().await;
        data_read.get::<DbPool>().unwrap().clone()
    };

    let mid = db::kv::get(&pool, "roles/mid")
        .await
        .unwrap_or("0".to_string())
        .parse::<u64>()
        .unwrap_or(0);

    if msg_id != mid {
        return;
    }

    let emoji_roles: HashMap<u64, u64> = db::roles::get_all(&pool)
        .await
        .unwrap()
        .into_iter()
        .map(|e| (e.eid as u64, e.rid as u64))
        .collect();

    match reaction.emoji {
        ReactionType::Custom { id, .. } => {
            if !emoji_roles.contains_key(&id.0) {
                return;
            }

            ctx.http
                .remove_member_role(
                    reaction.guild_id.unwrap().0,
                    reaction.user_id.unwrap().0,
                    *emoji_roles.get(&id.0).unwrap(),
                )
                .await
                .unwrap();
        }
        _ => (),
    }
}
