use tracing::error;
use serenity::framework::standard::{macros::command, Args, CommandResult};
use serenity::model::prelude::*;
use serenity::prelude::*;

#[command]
#[usage("[subcommand]")]
#[aliases("au", "among")]
#[description("Utilitários para o Among Us!")]
#[sub_commands(mute, map)]
async fn amongas(_ctx: &Context, _msg: &Message) -> CommandResult {
    Ok(())
}

#[command]
#[usage("[off]")]
#[description("Muta (ou desmuta) todos do canal de voz - experimental")]
#[owners_only]
async fn mute(ctx: &Context, msg: &Message, mut args: Args) -> CommandResult {
    let guild = msg.guild(&ctx.cache).await.unwrap();

    let off = match args.single::<String>() {
        Ok(cmd) => cmd == "off",
        Err(_) => false,
    };

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
            msg.channel_id
                .say(&ctx.http, "Oops, encontrei um problema!")
                .await?;

            return Ok(());
        }
    };

    let members = match channel.guild().unwrap().members(&ctx.cache).await {
        Ok(m) => m,
        Err(why) => {
            error!("Error getting member list: {:?}", why);
            msg.channel_id
                .say(&ctx.http, "Oops, encontrei um problema!")
                .await?;

            return Ok(());
        }
    };

    if off {
        msg.channel_id.say(&ctx.http, "Desmutando...").await?;
    } else {
        msg.channel_id.say(&ctx.http, "Mutando...").await?;
    }

    for member in members.iter() {
        member.edit(&ctx.http, |e| e.mute(!off)).await?;
    }

    Ok(())
}

#[command]
#[usage("[1|2|3]")]
#[description("Manda um dos mapas")]
async fn map(ctx: &Context, msg: &Message, mut args: Args) -> CommandResult {
    let url = match args.single::<u32>() {
        Ok(n) => match n {
            2 => "https://cdn.discordapp.com/attachments/759622831914352650/759917009127079966/image1.png",
            3 => "https://cdn.discordapp.com/attachments/759622831914352650/759917008723902554/image0.png",
            _ => "https://cdn.discordapp.com/attachments/759622831914352650/759920105705439323/x6oh24pisem51.png",
        },
        Err(_) => "https://cdn.discordapp.com/attachments/759622831914352650/759920105705439323/x6oh24pisem51.png"
    };

    msg.channel_id.say(&ctx.http, url).await?;

    Ok(())
}
