use crate::commands::{Command, CommandResult};

use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::model::interactions::application_command::{
    ApplicationCommandInteraction, ApplicationCommandInteractionDataOptionValue,
};
use serenity::model::prelude::*;
use serenity::prelude::*;

#[derive(Clone, Copy)]
pub struct AvatarCmd {}

#[async_trait]
impl Command for AvatarCmd {
    fn name(&self) -> &'static str {
        "avatar"
    }

    fn description(&self) -> &'static str {
        "Mostra o avatar de algum usuário"
    }

    fn create_command<'a>(&self, c: &'a mut CreateApplicationCommand) -> &'a mut CreateApplicationCommand {
        c.name(self.name()).description(self.description()).create_option(|o| {
            o.name("who")
                .description("De quem você quer ver?")
                .kind(application_command::ApplicationCommandOptionType::User)
        })
    }

    async fn run(&self, ctx: &Context, interaction: &ApplicationCommandInteraction) -> CommandResult {
        let options = &interaction.data.options;
        let user = if let Some(mention) = options.iter().find(|&x| x.name.as_str() == "who") {
            if let Some(value) = mention.resolved.as_ref() {
                if let ApplicationCommandInteractionDataOptionValue::User(user, _member) = value {
                    user
                } else {
                    &interaction.user
                }
            } else {
                &interaction.user
            }
        } else {
            &interaction.user
        };

        interaction
            .create_interaction_response(&ctx.http, |response| {
                response
                    .kind(InteractionResponseType::ChannelMessageWithSource)
                    .interaction_response_data(|message| message.content(user.face()))
            })
            .await?;

        Ok(())
    }
}
