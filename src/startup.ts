import { Client, Intents } from "discord.js";
import { Logger, TLogLevelName } from "tslog";
import { Container } from "typedi";
import admin, { ServiceAccount } from "firebase-admin";

import { InfoCmd } from "./commands/impl/info";
import { RolesCmd } from "./commands/impl/roles";
import { AvatarCmd } from "./commands/impl/avatar";
import { RobotCmd } from "./commands/impl/robot";
import { Firestore } from "@google-cloud/firestore";

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

  Container.set(Logger, new Logger({ minLevel: config.logLevel as TLogLevelName }));
  Container.set(
    Client,
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
  Container.set(Firestore, admin.firestore());
  Container.import([InfoCmd, RolesCmd, AvatarCmd, RobotCmd]);
};
