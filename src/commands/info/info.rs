use std::time::Instant;

use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::model::interactions::application_command::ApplicationCommandInteraction;
use serenity::model::prelude::*;
use serenity::prelude::*;

use crate::bot::Uptime;
use crate::commands::{Command, CommandResult};
use crate::utils::{get_shard_latency, seconds_to_days};
use crate::VERSION;

#[derive(Clone, Copy)]
pub struct InfoCmd {}

#[async_trait]
impl Command for InfoCmd {
    fn name(&self) -> &'static str {
        "info"
    }

    fn description(&self) -> &'static str {
        "Information"
    }

    fn create_command<'a>(&self, c: &'a mut CreateApplicationCommand) -> &'a mut CreateApplicationCommand {
        c.name(self.name()).description(self.description())
    }

    async fn run(&self, ctx: &Context, interaction: &ApplicationCommandInteraction) -> CommandResult {
        let shard_latency = get_shard_latency(ctx).await;

        let now = Instant::now();
        interaction
            .create_interaction_response(&ctx.http, |response| {
                response
                    .kind(InteractionResponseType::ChannelMessageWithSource)
                    .interaction_response_data(|message| message.content("Fetching..."))
            })
            .await?;

        let rest_latency = now.elapsed().as_millis();

        let uptime = {
            let instant = {
                let data_read = ctx.data.read().await;
                data_read.get::<Uptime>().unwrap().clone()
            };

            let duration = instant.elapsed();
            seconds_to_days(duration.as_secs())
        };

        interaction
            .edit_original_interaction_response(&ctx.http, |message| {
                message.content("");
                message.create_embed(|e| {
                    e.color((0xE8, 0x00, 0xFF));
                    e.title("Thor, the Rat");
                    e.field("Latency", format!("{}/{}ms", shard_latency, rest_latency), true);
                    e.field("Uptime", uptime, true);
                    e.field("Version", VERSION, true)
                })
            })
            .await?;

        Ok(())
    }
}
