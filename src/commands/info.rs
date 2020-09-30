use crate::ShardManagerContainer;
use crate::Uptime;

use serde_json::json;
use serenity::client::bridge::gateway::ShardId;
use serenity::framework::standard::{macros::command, CommandResult};
use serenity::model::prelude::*;
use serenity::prelude::*;
use std::time::Instant;

const VERSION: &'static str = env!("CARGO_PKG_VERSION");

#[command]
#[usage("")]
#[description("Marco? Polo!!")]
async fn marco(ctx: &Context, msg: &Message) -> CommandResult {
    let shard_latency = get_shard_latency(ctx).await;

    let map = json!({"content" : "Marco?"});

    let now = Instant::now();
    let mut message = ctx.http.send_message(msg.channel_id.0, &map).await?;
    let rest_latency = now.elapsed().as_millis();

    message
        .edit(ctx, |m| {
            m.content("");
            m.embed(|e| {
                e.color((0xE8, 0x00, 0xFF));
                e.title("Polo!");
                e.description(format!(
                    "Shard: {:>4}ms\nAPI: {:>4}ms",
                    shard_latency, rest_latency
                ))
            })
        })
        .await?;

    Ok(())
}

#[command]
#[usage("")]
#[description("Informações do bot")]
async fn info(ctx: &Context, msg: &Message) -> CommandResult {
    let shard_latency = get_shard_latency(ctx).await;

    let map = json!({"content" : "..."});

    let now = Instant::now();
    let mut message = ctx.http.send_message(msg.channel_id.0, &map).await?;
    let rest_latency = now.elapsed().as_millis();

    let uptime = {
        let instant = {
            let data_read = ctx.data.read().await;
            data_read.get::<Uptime>().unwrap().clone()
        };

        let duration = instant.elapsed();
        seconds_to_days(duration.as_secs())
    };

    message
        .edit(ctx, |m| {
            m.content("");
            m.embed(|e| {
                e.color((0xE8, 0x00, 0xFF));
                e.title("Thor, the Rat");
                e.field(
                    "Latency",
                    format!("{}/{}ms", shard_latency, rest_latency),
                    true,
                );
                e.field("Uptime", uptime, true);
                e.field("Version", VERSION, true)
            })
        })
        .await?;

    Ok(())
}

async fn get_shard_latency(ctx: &Context) -> u64 {
    let shard_manager = {
        let data = ctx.data.read().await;
        data.get::<ShardManagerContainer>().unwrap().clone()
    };

    let manager = shard_manager.lock().await;
    let runners = manager.runners.lock().await;

    let runner = match runners.get(&ShardId(ctx.shard_id)) {
        Some(runner) => runner,
        None => {
            return 0;
        }
    };

    let shard_latency = match runner.latency {
        Some(ms) => ms.as_millis() as u64,
        _ => 0,
    };

    shard_latency
}

pub fn seconds_to_days(seconds: u64) -> String {
    let days = seconds / 60 / 60 / 24;
    let hours = seconds / 3600 % 24;
    let minutes = seconds % 3600 / 60;
    let sec = seconds % 3600 % 60;

    if days == 0 {
        format!("{}:{:02}:{:02}", hours, minutes, sec)
    } else {
        format!("{}D {}:{:02}:{:02}", days, hours, minutes, sec)
    }
}
