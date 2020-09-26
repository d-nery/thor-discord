use log::{error, info};
use serenity::framework::standard::{macros::command, Args, CommandResult};
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

const SPY_ID: u64 = 348917866222845952;

#[command]
#[usage("[off]")]
#[description("Muta o espião no seu canal de voz, as vezes precisa né.")]
#[aliases("sm")]
#[only_in("guild")]
async fn spymute(ctx: &Context, msg: &Message, mut args: Args) -> CommandResult {
    if *msg.author.id.as_u64() == SPY_ID {
        msg.channel_id
            .say(&ctx.http, "Espião, você não pode usar esse comando...")
            .await?;

        return Ok(());
    }

    let off = match args.single::<String>() {
        Ok(cmd) => cmd == "off",
        Err(_) => false,
    };

    let guild = msg.guild(&ctx.cache).await.unwrap();

    let channel_id = match guild
        .voice_states
        .get(&msg.author.id)
        .and_then(|vs| vs.channel_id)
    {
        Some(cid) => cid,
        None => {
            msg.channel_id
                .say(&ctx.http, "Você não está num canal de voz!")
                .await?;
            return Ok(());
        }
    };

    let channel = match channel_id.to_channel(&ctx).await {
        Ok(ch) => ch,
        Err(why) => {
            error!("Error getting channel: {:?}", why);

            return Err(why);
        }
    };

    let members = match channel.guild().unwrap().members(&ctx.cache).await {
        Ok(m) => m,
    };

    Ok(())
}
