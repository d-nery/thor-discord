pub mod games;
pub mod info;
pub mod misc;
pub mod owner;

use serenity::{
    async_trait,
    builder::{CreateApplicationCommand, CreateApplicationCommandPermissionsData},
    client::Context,
    model::interactions::{application_command::ApplicationCommandInteraction, Interaction},
};

use self::{
    games::amongas::AmongasCmd,
    info::{info::InfoCmd, marco::MarcoCmd},
    misc::avatar::AvatarCmd,
    owner::roles::RolesCmd,
};

#[derive(Debug)]
pub enum CommandError {
    SerenityError(serenity::Error),
    SqlError(sqlx::Error),
    Other(String),
    CommandNotFound,
}

impl From<sqlx::Error> for CommandError {
    fn from(err: sqlx::Error) -> Self {
        CommandError::SqlError(err)
    }
}

impl From<serenity::Error> for CommandError {
    fn from(err: serenity::Error) -> Self {
        CommandError::SerenityError(err)
    }
}

pub type CommandResult = Result<(), CommandError>;

pub static COMMANDS: &[&dyn Command; 5] = &[&MarcoCmd {}, &InfoCmd {}, &AmongasCmd {}, &AvatarCmd {}, &RolesCmd {}];

#[async_trait]
pub trait Command: Sync {
    fn name(&self) -> &'static str;
    fn description(&self) -> &'static str;
    fn create_command<'a>(&self, c: &'a mut CreateApplicationCommand) -> &'a mut CreateApplicationCommand;
    fn permissions<'a>(
        &self,
        _owner_id: u64,
        p: &'a mut CreateApplicationCommandPermissionsData,
    ) -> &'a mut CreateApplicationCommandPermissionsData {
        p
    }
    async fn run(&self, ctx: &Context, interaction: &ApplicationCommandInteraction) -> CommandResult;
}

pub async fn run(name: &str, ctx: &Context, interaction: &Interaction) -> CommandResult {
    for &cmd in COMMANDS {
        if name == cmd.name() {
            return cmd.run(&ctx, &interaction.clone().application_command().unwrap()).await;
        }
    }

    Err(CommandError::CommandNotFound)
}
