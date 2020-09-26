use rand::seq::SliceRandom;
use serenity::framework::standard::{macros::command, CommandResult};
use serenity::model::prelude::*;
use serenity::prelude::*;

#[command]
#[usage("")]
#[description("GG izi")]
async fn gg(ctx: &Context, msg: &Message) -> CommandResult {
    let options = vec!["izi", "ez!", "coxa"];
    let choice = options.choose(&mut rand::thread_rng());

    msg.channel_id.say(&ctx.http, choice.unwrap()).await?;

    Ok(())
}

#[command]
#[usage("")]
#[description("Joga uma moeda")]
async fn coin(ctx: &Context, msg: &Message) -> CommandResult {
    let n: f64 = rand::random();

    msg.channel_id
        .say(
            &ctx.http,
            if n < 0.001 {
                "Eita, caiu em pé!"
            } else if n < 0.5005 {
                "Cara!"
            } else {
                "Coroa!"
            },
        )
        .await?;

    Ok(())
}
