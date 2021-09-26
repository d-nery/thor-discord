use std::env;

use clap::{load_yaml, App};
use tracing::{debug, info, instrument};

use thor_discord::{bot, utils::print_formatted_commands};

#[tokio::main]
#[instrument]
async fn main() {
    kankyo::load(false).expect("Failed to load .env file");
    tracing_subscriber::fmt::init();

    let app = load_yaml!("cli.yml");
    let matches = App::from(app).get_matches();

    debug!("Initializing THOR Discord CLI");

    let token = if let Some(value) = matches.value_of("token") {
        value.into()
    } else {
        env::var("DISCORD_TOKEN").expect("Expected a token in the environment")
    };

    let app_id = if let Some(id) = matches.value_of("appid") {
        id.into()
    } else {
        env::var("APPLICATION_ID").expect("Expected an application id in the environment")
    }
    .parse()
    .expect("application id is not a valid id");

    let thor = bot::Bot::new(token, app_id);

    match matches.subcommand() {
        Some(("start", _)) => {
            thor.run().await;
        }
        Some(("commands", commands)) => {
            let gid = if let Some(id) = commands.value_of("gid") {
                id.into()
            } else {
                env::var("GUILD_ID").expect("Expected a guild id in the environment")
            }
            .parse()
            .expect("guild id is not a valid id");

            match commands.subcommand() {
                Some(("list", _list)) => {
                    info!("Searching commands for guild {}", gid);

                    let cmds = thor.list_commands(gid).await.unwrap();

                    if cmds.is_empty() {
                        println!("No commands found!");
                        return;
                    }

                    print_formatted_commands(cmds);
                }
                Some(("delete", delete)) => {
                    let id: u64 = delete.value_of("id").unwrap().parse().expect("id is not a valid id");
                    info!("Deleting command {}", id);
                    thor.delete_command(gid, id).await.unwrap();
                }
                Some(("create", _create)) => {
                    info!("Creating commands for guild {}", gid);
                    thor.create_commands(gid).await.unwrap();
                }
                _ => unreachable!(),
            }
        }
        _ => unreachable!(),
    }
}
