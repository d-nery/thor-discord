use crate::DbPool;
use crate::ShardManagerContainer;
use serenity::framework::standard::{macros::command, Args, CommandResult};
use serenity::model::prelude::*;
use serenity::prelude::*;
use serenity::utils::MessageBuilder;
use sqlx;
use tracing::info;

#[command]
#[owners_only]
async fn kill(ctx: &Context, msg: &Message) -> CommandResult {
    let data = ctx.data.read().await;

    if let Some(manager) = data.get::<ShardManagerContainer>() {
        msg.reply(ctx, "Shutting down!").await?;
        manager.lock().await.shutdown_all().await;
    } else {
        msg.reply(ctx, "There was a problem getting the shard manager").await?;

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
#[sub_commands(send)]
async fn roles(ctx: &Context, msg: &Message, _args: Args) -> CommandResult {
    Ok(())
}

#[command]
#[owners_only]
#[num_args(1)]
async fn send(ctx: &Context, msg: &Message, mut args: Args) -> CommandResult {
    let channel = match args.single::<ChannelId>() {
        Ok(cid) => cid,
        Err(_) => {
            return Ok(());
        }
    };

    let guild = msg.guild(&ctx.cache).await.unwrap();
    let emojis = &guild.emojis;
    let roles = &guild.roles;

    let emoji_roles = [
        (756167876892819587, 756173259023712356, "Among Us"),
        (757979945073901719, 758031459322822886, "Fall Guys"),
        (695713356677382144, 694697369601703947, "Minecraft"),
        (695711532625035335, 694698985096740955, "League of Legends"),
        (695713708206325850, 695274941020635206, "Don't Starve Together"),
        (757979366205423627, 757979414930653256, "Valorant"),
        (695715960354635786, 695718502497255516, "Gartic"),
    ];

    let mut text = MessageBuilder::new();

    text.push_line("Reaja abaixo para escolher um cargo de jogo e receber notificação se mencionarem!")
        .push_line("");

    for er in emoji_roles.iter() {
        text.mention(emojis.get(&EmojiId(er.0)).unwrap())
            .push("  ")
            .mention(roles.get(&RoleId(er.1)).unwrap())
            .push("  -> ")
            .push_line(er.2);
    }

    let message = channel.say(&ctx, text.build()).await?;

    for er in emoji_roles.iter() {
        let emoji = emojis.get(&EmojiId(er.0)).unwrap().clone();
        message.react(&ctx, emoji).await?;
    }

    info!("Updating DB with new channel ID");

    let pool = {
        let data_read = ctx.data.read().await;
        data_read.get::<DbPool>().unwrap().clone()
    };

    let cid = channel.0 as i64;
    let mid = message.id.0 as i64;

    sqlx::query!(
        "INSERT OR REPLACE INTO KV(key, value) VALUES (?, ?), (?, ?)",
        "roles/cid",
        cid,
        "roles/mid",
        mid
    )
    .execute(&pool)
    .await?;

    Ok(())
}
