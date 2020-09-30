use crate::ShardManagerContainer;
use serenity::framework::standard::{macros::command, Args, CommandResult};
use serenity::model::prelude::*;
use serenity::prelude::*;

#[command]
#[owners_only]
async fn kill(ctx: &Context, msg: &Message) -> CommandResult {
    let data = ctx.data.read().await;

    if let Some(manager) = data.get::<ShardManagerContainer>() {
        msg.reply(ctx, "Shutting down!").await?;
        manager.lock().await.shutdown_all().await;
    } else {
        msg.reply(ctx, "There was a problem getting the shard manager")
            .await?;

        return Ok(());
    }

    Ok(())
}

#[command]
#[owners_only]
async fn welcome(ctx: &Context, msg: &Message, _args: Args) -> CommandResult {
    msg.channel_id.say(&ctx.http, "NYI").await?;
    Ok(())
}

#[command]
#[owners_only]
async fn roles(ctx: &Context, msg: &Message, _args: Args) -> CommandResult {
    msg.channel_id.say(&ctx.http, "NYI").await?;
    Ok(())
}
