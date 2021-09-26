use crate::commands::{Command, CommandResult};

use serenity::builder::CreateApplicationCommand;
use serenity::client::Context;
use serenity::model::interactions::application_command::{ApplicationCommandInteraction, ApplicationCommandOptionType};
use serenity::model::interactions::InteractionResponseType;
use serenity::{async_trait, Error};
use tracing::info;

#[derive(Clone, Copy)]
pub struct AmongasCmd {}

#[async_trait]
impl Command for AmongasCmd {
    fn name(&self) -> &'static str {
        "amongas"
    }

    fn description(&self) -> &'static str {
        "Utilitários de amongas"
    }

    fn create_command<'a>(&self, c: &'a mut CreateApplicationCommand) -> &'a mut CreateApplicationCommand {
        c.name(self.name()).description(self.description()).create_option(|o| {
            o.name("map")
                .description("Mostra os mapas")
                .kind(ApplicationCommandOptionType::SubCommand)
                .create_sub_option(|so| {
                    so.name("name")
                        .description("Nome do mapa a mostrar")
                        .kind(ApplicationCommandOptionType::String)
                        .required(true)
                        .add_string_choice("The Skeld", "skeld")
                        .add_string_choice("Mira HQ", "mira")
                        .add_string_choice("Polus", "polus")
                })
        })
    }

    async fn run(&self, ctx: &Context, interaction: &ApplicationCommandInteraction) -> CommandResult {
        let options = &interaction.data.options;

        for option in options {
            match option.name.as_str() {
                "map" => {
                    let name = option.options.get(0).ok_or(Error::Other("couldn't find name"))?;
                    info!("Running command map {:?}", name);

                    let url = match &name.value {
                        Some(val) => match val.as_str().ok_or(Error::Other("couldn't parse name value"))? {
                            "mira" => "https://cdn.discordapp.com/attachments/759622831914352650/759917009127079966/image1.png",
                            "polus" => "https://cdn.discordapp.com/attachments/759622831914352650/759917008723902554/image0.png",
                            _ => "https://cdn.discordapp.com/attachments/759622831914352650/759920105705439323/x6oh24pisem51.png",
                        },
                        None => "https://cdn.discordapp.com/attachments/759622831914352650/759920105705439323/x6oh24pisem51.png"
                    };

                    interaction
                        .create_interaction_response(&ctx.http, |response| {
                            response
                                .kind(InteractionResponseType::ChannelMessageWithSource)
                                .interaction_response_data(|message| message.content(url))
                        })
                        .await?;
                }
                _ => (),
            }
        }

        Ok(())
    }
}
