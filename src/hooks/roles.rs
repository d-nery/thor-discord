use serenity::{
    model::channel::{Reaction, ReactionType},
    prelude::*,
};

use tracing::info;

pub async fn reaction_add(ctx: &Context, reaction: Reaction) {
    // Ignore the bot
    if &reaction.user_id.unwrap().0 == ctx.cache.current_user().await.id.as_u64() {
        return;
    }

    let msg_id = reaction.message_id.0;

    // if msg_id != 0 {
    //     return;
    // }

    match reaction.emoji {
        ReactionType::Custom { id, .. } => info!("Reaction {} on msg {}", id.0, msg_id),
        _ => (),
    }
}
