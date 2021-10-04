import { Client, Intents } from "discord.js";
import { Logger, TLogLevelName } from "tslog";
import { Container } from "typedi";
import admin, { ServiceAccount } from "firebase-admin";

import { InteractionHandler, InteractionHandlerToken } from "./services/InteractionHandler";
import { ConfigRepository, ConfigRepositoryToken } from "./services/ConfigRepository";

import { InfoCmd } from "./commands/impl/info";
import { RolesCmd } from "./commands/impl/roles";
import { AvatarCmd } from "./commands/impl/avatar";
import { ReactionHandler, ReactionHandlerToken } from "./services/ReactionHandler";

/**
 * This method initializes everything and injects all dependencies
 */
export default async (): Promise<void> => {
  let config = (await import("../config.json")).default;

  if (process.env.NODE_ENV === "debug") {
    const devConfig = (await import("../config.dev.json")).default;
    config = { ...config, ...devConfig };
  }

  Container.set("discord.token", config.token);

  Container.set("logger", new Logger({ minLevel: config.logLevel as TLogLevelName }));
  Container.set(
    "discord.client",
    new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
      ],
      allowedMentions: { parse: ["roles", "users", "everyone"] },
      partials: ["MESSAGE", "CHANNEL", "REACTION"],
    })
  );

  // Initialize DB client
  admin.initializeApp({ credential: admin.credential.cert(config.firebase as ServiceAccount) });
  Container.set("db.firestore_client", admin.firestore());
  Container.set(ConfigRepositoryToken, Container.get(ConfigRepository));

  // Initialze all commands and handlers
  Container.import([InfoCmd, RolesCmd, AvatarCmd]);
  Container.set(InteractionHandlerToken, Container.get(InteractionHandler));
  Container.set(ReactionHandlerToken, Container.get(ReactionHandler));
};
