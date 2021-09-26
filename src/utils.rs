use crate::bot::ShardManagerContainer;
use serenity::client::bridge::gateway::ShardId;
use serenity::{client::Context, model::interactions::application_command::ApplicationCommand};

pub fn print_formatted_commands(commands: Vec<ApplicationCommand>) {
    println!("Commands:");
    println!("ID                 | Name            | Description");
    println!("------------------ | --------------- | ----------------------------------");

    for cmd in commands {
        println!("{} | {:15} | {}", cmd.id, cmd.name, cmd.description);
    }
}

pub async fn get_shard_latency(ctx: &Context) -> u64 {
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
