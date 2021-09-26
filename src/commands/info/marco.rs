use std::time::Instant;

use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::model::interactions::application_command::ApplicationCommandInteraction;
use serenity::model::prelude::*;
use serenity::prelude::*;

use crate::commands::{Command, CommandResult};
use crate::utils::get_shard_latency;

#[derive(Clone, Copy)]
pub struct MarcoCmd {}

#[async_trait]
impl Command for MarcoCmd {
    fn name(&self) -> &'static str {
        "marco"
    }

    fn description(&self) -> &'static str {
        "Marco? Polo!"
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
                    .interaction_response_data(|message| message.content("Marco?"))
            })
            .await?;

        let rest_latency = now.elapsed().as_millis();

        interaction
            .edit_original_interaction_response(&ctx.http, |message| {
                message.content("");
                message.create_embed(|e| {
                    e.color((0xE8, 0x00, 0xFF));
                    e.title("Polo!");
                    e.description(format!("Shard: {:>4}ms\nAPI: {:>4}ms", shard_latency, rest_latency))
                })
            })
            .await?;

        Ok(())
    }
}
