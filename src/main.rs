mod commands;
mod hooks;

use commands::{games::*, geral::*, info::*, misc::*, owner::*};
use log::{error, info};
use serenity::{
    async_trait,
    client::bridge::gateway::ShardManager,
    framework::standard::{
        help_commands,
        macros::{group, help},
        Args, CommandGroup, CommandResult, HelpOptions, StandardFramework,
    },
    http::Http,
    model::prelude::*,
    model::{event::ResumedEvent, gateway::Ready},
    prelude::*,
};
use std::{collections::HashSet, env, sync::Arc, time::Instant};

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
    async fn ready(&self, _: Context, ready: Ready) {
        info!("Connected as {}", ready.user.name);
    }

    async fn resume(&self, _: Context, _: ResumedEvent) {
        info!("Resumed");
    }
}

#[group]
#[commands(avatar, spymute)]
struct Geral;

#[group]
#[commands(marco, info)]
struct Info;

#[group]
#[commands(amongas)]
struct Games;

#[group]
#[commands(gg, coin)]
struct Misc;

#[group]
#[commands(kill)]
struct BotAdmin;

#[help]
#[lacking_permissions("hide")]
#[lacking_ownership("hide")]
#[lacking_role("hide")]
#[strikethrough_commands_tip_in_dm("")]
#[strikethrough_commands_tip_in_guild("")]
#[command_not_found_text("Não encontrei o comando `{}` :(")]
#[max_levenshtein_distance(3)]
async fn bot_help(
    context: &Context,
    msg: &Message,
    args: Args,
    help_options: &'static HelpOptions,
    groups: &[&'static CommandGroup],
    owners: HashSet<UserId>,
) -> CommandResult {
    let _ = help_commands::with_embeds(context, msg, args, &help_options, groups, owners).await;
    Ok(())
}

#[tokio::main]
async fn main() {
    kankyo::load(false).expect("Failed to load .env file");
    env_logger::init();

    info!("THOR Discord - Initializing");

    let token = env::var("DISCORD_TOKEN").expect("Expected a token in the environment");
    let prefix = env::var("BOT_PREFIX").expect("Expected a bot prefix in the environment");
    let http = Http::new_with_token(&token);

    let (owners, bot_id) = match http.get_current_application_info().await {
        Ok(info) => {
            let mut owners = HashSet::new();
            owners.insert(info.owner.id);

            (owners, info.id)
        }
        Err(why) => panic!("Could not access application info: {:?}", why),
    };

    let framework = StandardFramework::new()
        .configure(|c| {
            c.owners(owners)
                .with_whitespace(true)
                .on_mention(Some(bot_id))
                .prefix(&prefix)
                .delimiters(vec![", ", ",", " "])
        })
        .before(hooks::before)
        .after(hooks::after)
        .help(&BOT_HELP)
        .group(&GERAL_GROUP)
        .group(&GAMES_GROUP)
        .group(&INFO_GROUP)
        .group(&MISC_GROUP)
        .group(&BOTADMIN_GROUP);

    let mut client = Client::new(&token)
        .framework(framework)
        .event_handler(Handler)
        .await
        .expect("Err creating client");

    {
        let mut data = client.data.write().await;
        data.insert::<ShardManagerContainer>(client.shard_manager.clone());
        data.insert::<Uptime>(Arc::new(Instant::now()));
    }

    if let Err(why) = client.start().await {
        error!("Client error: {:?}", why);
    }
}
