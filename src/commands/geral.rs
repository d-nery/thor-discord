use serenity::framework::standard::{macros::command, CommandResult};
use serenity::model::prelude::*;
use serenity::prelude::*;

#[command]
#[usage("[@Mention]")]
#[description("Vê o avatar de alguém.")]
async fn avatar(ctx: &Context, msg: &Message) -> CommandResult {
    let user = if msg.mentions.len() > 0 {
        &msg.mentions[0]
    } else {
        &msg.author
    };

    msg.channel_id.say(&ctx.http, user.face()).await?;

    Ok(())
}

const spyId: u64 = 348917866222845952;

#[command]
#[usage("[off]")]
#[description("Muta o espião no seu canal de voz, as vezes precisa né.")]
#[aliases("sm")]
#[only_in("guild")]
async fn spymute(ctx: &Context, msg: &Message) -> CommandResult {
    if *msg.author.id.as_u64() == spyId {
        msg.channel_id
            .say(&ctx.http, "Espião, você não pode usar esse comando...")
            .await?;

        return Ok(());
    }

    let guild = msg.guild(&ctx.cache).await.unwrap();

    let channel_id = guild
        .voice_states
        .get(&msg.author.id)
        .and_then(|voice_state| voice_state.channel_id);

    Ok(())
}
