use serenity::async_trait;
use serenity::builder::{CreateApplicationCommand, CreateApplicationCommandPermissionsData};
use serenity::model::interactions::application_command::{
    ApplicationCommandInteraction, ApplicationCommandPermissionType,
};
use serenity::model::prelude::*;
use serenity::prelude::*;
use serenity::utils::MessageBuilder;
use tracing::info;

use crate::commands::{Command, CommandError, CommandResult};
use crate::db;
use crate::db::DbPool;

#[derive(Clone, Copy)]
pub struct RolesCmd {}

#[async_trait]
impl Command for RolesCmd {
    fn name(&self) -> &'static str {
        "roles"
    }

    fn description(&self) -> &'static str {
        "Roles"
    }

    fn create_command<'a>(&self, c: &'a mut CreateApplicationCommand) -> &'a mut CreateApplicationCommand {
        c.name(self.name())
            .description(self.description())
            .default_permission(false)
    }

    fn permissions<'a>(
        &self,
        owner_id: u64,
        p: &'a mut CreateApplicationCommandPermissionsData,
    ) -> &'a mut CreateApplicationCommandPermissionsData {
        p.create_permission(|perm| {
            perm.kind(ApplicationCommandPermissionType::User)
                .id(owner_id)
                .permission(true)
        })
    }

    async fn run(&self, ctx: &Context, interaction: &ApplicationCommandInteraction) -> CommandResult {
        let pool = {
            let data_read = ctx.data.read().await;
            data_read.get::<DbPool>().unwrap().clone()
        };

        let channel = interaction.channel_id;
        let guild = interaction.guild_id.unwrap();
        let emojis = &guild.emojis(&ctx.http).await?;
        let roles = &guild.roles(&ctx.http).await?;

        let emoji_roles = db::roles::get_all(&pool).await?;

        let mut text = MessageBuilder::new();

        text.push_line("Reaja abaixo para escolher um cargo de jogo e receber notificação se mencionarem!")
            .push_line("");

        for er in emoji_roles.iter() {
            text.mention(
                emojis
                    .iter()
                    .find(|&e| e.id.0 == (er.eid as u64))
                    .ok_or(CommandError::Other("Couldn't find emoji".into()))?,
            )
            .push("  ")
            .mention(roles.get(&RoleId(er.rid as u64)).unwrap())
            .push("  -> ")
            .push_line(er.description.clone());
        }

        interaction
            .create_interaction_response(&ctx.http, |response| {
                response
                    .kind(InteractionResponseType::ChannelMessageWithSource)
                    .interaction_response_data(|message| message.content(text.build()))
            })
            .await?;

        let message = interaction.get_interaction_response(&ctx.http).await?;

        for er in emoji_roles.iter() {
            let emoji = emojis.iter().find(|&e| e.id.0 == (er.eid as u64)).unwrap().clone();
            message.react(&ctx, emoji).await?;
        }

        info!("Updating DB with new channel ID");

        let cid = channel.0 as i64;
        let mid = message.id.0 as i64;

        db::kv::set(&pool, "roles/cid", cid.to_string()).await?;
        db::kv::set(&pool, "roles/mid", mid.to_string()).await?;

        Ok(())
    }

    // TODO subcomando de adicionar role
}
