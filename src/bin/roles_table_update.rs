use sqlx::SqlitePool;
use thor_discord::db::{self, roles::EmojiRole};

#[tokio::main]
async fn main() {
    let pool = SqlitePool::connect(&env!("DATABASE_URL"))
        .await
        .expect("Error opening DB");

    let emoji_roles = [
        (756167876892819587, 756173259023712356, "Among Us"),
        (757979945073901719, 758031459322822886, "Fall Guys"),
        (695713356677382144, 694697369601703947, "Minecraft"),
        (695711532625035335, 694698985096740955, "League of Legends"),
        (695713708206325850, 695274941020635206, "Don't Starve Together"),
        (757979366205423627, 757979414930653256, "Valorant"),
        (695715960354635786, 695718502497255516, "Gartic"),
        (891548368122282004, 877261761173127248, "Smash Karts"),
    ]
    .iter()
    .map(|e| EmojiRole {eid: e.0, rid: e.1, description: e.2.into()});

    for er in emoji_roles {
        if let Err(err) = db::roles::insert(&pool, er.clone()).await {
            print!("Error inserting {:?}: {:?}", er, err);
        }
    }
}
