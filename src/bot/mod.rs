mod reactions;

use serenity::{
    async_trait,
    client::bridge::gateway::ShardManager,
    http::Http,
    model::{
        channel::Reaction,
        event::ResumedEvent,
        id::{CommandId, GuildId, UserId},
        interactions::{
            application_command::ApplicationCommand, Interaction, InteractionApplicationCommandCallbackDataFlags,
            InteractionResponseType,
        },
        prelude::{Activity, OnlineStatus, Ready},
    },
    prelude::*,
};
use sqlx::SqlitePool;
use std::{sync::Arc, time::Instant};
use tracing::{error, info};

use crate::commands::{self, COMMANDS};
use crate::db::DbPool;

pub struct ShardManagerContainer;

impl TypeMapKey for ShardManagerContainer {
    type Value = Arc<Mutex<ShardManager>>;
}

pub struct Uptime;

impl TypeMapKey for Uptime {
    type Value = Arc<Instant>;
}

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, context: Context, ready: Ready) {
        let http = &context.http;

        let api_version = ready.version;
        let bot_gateway = http.get_bot_gateway().await.unwrap();
        let t_sessions = bot_gateway.session_start_limit.total;
        let r_sessions = bot_gateway.session_start_limit.remaining;
        let bot_owner = http.get_current_application_info().await.unwrap().owner;

        info!("Successfully logged into Discord as the following user:");
        info!("Bot username: {}", ready.user.tag());
        info!("Bot user ID: {}", ready.user.id);
        info!("Bot owner: {}", bot_owner.tag());

        let guild_count = ready.guilds.len();

        info!(
            "Connected to the Discord API (version {}) with {}/{} sessions remaining.",
            api_version, r_sessions, t_sessions
        );
        info!("Connected to and serving a total of {} guild(s).", guild_count);

        context
            .set_presence(
                Some(Activity::streaming(
                    "WCXV",
                    "https://www.youtube.com/watch?v=XZHTBcfhZwg",
                )),
                OnlineStatus::Online,
            )
            .await;
    }

    async fn resume(&self, _: Context, _: ResumedEvent) {
        info!("Resumed");
    }

    async fn reaction_add(&self, ctx: Context, add_reaction: Reaction) {
        reactions::reaction_add(&ctx, add_reaction).await;
    }

    async fn reaction_remove(&self, ctx: Context, remove_reaction: Reaction) {
        reactions::reaction_remove(&ctx, remove_reaction).await;
    }

    async fn interaction_create(&self, ctx: Context, interaction: Interaction) {
        let command = if let Interaction::ApplicationCommand(ref cmd) = interaction {
            cmd
        } else {
            return;
        };

        let cmd_name = command.data.name.as_str();
        let user = format!("{} ({})", command.user.tag(), command.user.id);

        info!("Received slash command {} from {}", cmd_name, user);

        if let Err(err) = commands::run(cmd_name, &ctx, &interaction).await {
            error!("Error running command {} from {}: {:?}", cmd_name, user, err);

            command
                .create_interaction_response(&ctx.http, |response| {
                    response
                        .kind(InteractionResponseType::ChannelMessageWithSource)
                        .interaction_response_data(|message| {
                            message
                                .content("Oops! Ocorreu um erro :(")
                                .flags(InteractionApplicationCommandCallbackDataFlags::EPHEMERAL)
                        })
                })
                .await
                .unwrap();
        } else {
            info!("Finished executing command {} by {}", cmd_name, user);
        }
    }
}

pub struct Bot {
    token: String,
    app_id: u64,
}

impl Bot {
    pub fn new(token: String, app_id: u64) -> Self {
        Bot { token, app_id }
    }

    pub fn http(&self) -> Http {
        Http::new_with_token_application_id(self.token.as_str(), self.app_id)
    }

    pub async fn list_commands(&self, gid: u64) -> Result<Vec<ApplicationCommand>, SerenityError> {
        self.http().get_guild_application_commands(gid).await
    }

    pub async fn owner_id(&self) -> UserId {
        if let Ok(info) = self.http().get_current_application_info().await {
            info.owner.id
        } else {
            UserId(0)
        }
    }

    pub async fn create_commands(&self, gid: u64) -> Result<(), SerenityError> {
        let http = self.http();
        let owner_id = self.owner_id().await.0;

        for &cmd in COMMANDS {
            let command_id = GuildId(gid)
                .create_application_command(&http, |c| cmd.create_command(c))
                .await?
                .id;

            GuildId(gid)
                .create_application_command_permission(&http, command_id, |p| cmd.permissions(owner_id, p))
                .await?;
        }

        Ok(())
    }

    pub async fn delete_command(&self, gid: u64, cid: u64) -> Result<(), SerenityError> {
        let http = self.http();

        GuildId(gid).delete_application_command(&http, CommandId(cid)).await
    }

    pub async fn run(&self) {
        let mut client = Client::builder(&self.token)
            .event_handler(Handler)
            .application_id(self.app_id)
            .await
            .expect("Error creating client");

        {
            let mut data = client.data.write().await;
            data.insert::<ShardManagerContainer>(client.shard_manager.clone());
            data.insert::<Uptime>(Arc::new(Instant::now()));

            let pool = SqlitePool::connect(&env!("DATABASE_URL"))
                .await
                .expect("Error opening DB");

            sqlx::migrate!().run(&pool).await.unwrap();
            data.insert::<DbPool>(pool);
        }

        if let Err(why) = client.start().await {
            error!("Client error: {:?}", why);
        }
    }
}
