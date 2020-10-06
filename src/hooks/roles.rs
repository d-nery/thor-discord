use std::collections::HashMap;

use crate::DbPool;

use serenity::{
    model::channel::{Reaction, ReactionType},
    prelude::*,
};
use sqlx;

pub async fn reaction_add(ctx: &Context, reaction: Reaction) {
    // Ignore the bot
    if &reaction.user_id.unwrap().0 == ctx.cache.current_user().await.id.as_u64() {
        return;
    }

    let msg_id = reaction.message_id.0;

    let pool = {
        let data_read = ctx.data.read().await;
        data_read.get::<DbPool>().unwrap().clone()
    };

    let mid = match sqlx::query!("SELECT value FROM KV WHERE key = ?", "roles/mid",)
        .fetch_one(&pool)
        .await
    {
        Ok(v) => v.value.parse::<u64>().expect("Failed to parse value from database"),
        Err(_) => return,
    };

    if msg_id != mid {
        return;
    }

    let emoji_roles: HashMap<u64, u64> = vec![
        (756167876892819587, 756173259023712356),
        (757979945073901719, 758031459322822886),
        (695713356677382144, 694697369601703947),
        (695711532625035335, 694698985096740955),
        (695713708206325850, 695274941020635206),
        (757979366205423627, 757979414930653256),
        (695715960354635786, 695718502497255516),
    ]
    .into_iter()
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
                    .await;
            }

            ctx.http
                .add_member_role(
                    reaction.guild_id.unwrap().0,
                    reaction.user_id.unwrap().0,
                    *emoji_roles.get(&id.0).unwrap(),
                )
                .await;
        }
        _ => {
            ctx.http
                .delete_reaction(
                    reaction.channel_id.0,
                    mid,
                    Some(reaction.user_id.unwrap().0),
                    &reaction.emoji,
                )
                .await;
        }
    }
}

pub async fn reaction_remove(ctx: &Context, reaction: Reaction) {
    // Ignore the bot
    if &reaction.user_id.unwrap().0 == ctx.cache.current_user().await.id.as_u64() {
        return;
    }

    let msg_id = reaction.message_id.0;

    let pool = {
        let data_read = ctx.data.read().await;
        data_read.get::<DbPool>().unwrap().clone()
    };

    let mid = match sqlx::query!("SELECT value FROM KV WHERE key = ?", "roles/mid",)
        .fetch_one(&pool)
        .await
    {
        Ok(v) => v.value.parse::<u64>().expect("Failed to parse value from database"),
        Err(_) => return,
    };

    if msg_id != mid {
        return;
    }

    let emoji_roles: HashMap<u64, u64> = vec![
        (756167876892819587, 756173259023712356),
        (757979945073901719, 758031459322822886),
        (695713356677382144, 694697369601703947),
        (695711532625035335, 694698985096740955),
        (695713708206325850, 695274941020635206),
        (757979366205423627, 757979414930653256),
        (695715960354635786, 695718502497255516),
    ]
    .into_iter()
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
                .await;
        }
        _ => (),
    }
}
