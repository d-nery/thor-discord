import { Client, Intents } from "discord.js";
import { ISettingsParam, Logger, TLogLevelName } from "tslog";
import { Container } from "typedi";
import admin, { ServiceAccount } from "firebase-admin";

import { RolesCmd } from "./commands/admin/roles";
import { InfoCmd } from "./commands/misc/info";
import { AvatarCmd } from "./commands/misc/avatar";
import { RobotCmd } from "./commands/misc/robot";
import { Firestore } from "@google-cloud/firestore";

import { version } from "../package.json";
import { CasinoProfileCmd } from "./commands/casino/profile";
import { CasinoRegisterCmd } from "./commands/casino/register";
import { CasinoBichoCmd } from "./commands/casino/bicho/bicho";
import { CasinoBichoHelpCmd } from "./commands/casino/bicho/help";
import { CasinoBichoBetCmd } from "./commands/casino/bicho/bet";
import { ReloadCmd } from "./commands/admin/reload";
import { CasinoDailyCmd } from "./commands/casino/daily";
import { CasinoWalletCmd } from "./commands/casino/wallet/wallet";
import { CasinoWalletSeeCmd } from "./commands/casino/wallet/see";
import { CasinoWalletTransferCmd } from "./commands/casino/wallet/transfer";

/**
 * This method initializes everything and injects all dependencies
 */
export default async (): Promise<void> => {
  let config = (await import("../config.json")).default;
  let log_config: ISettingsParam = {
    minLevel: config.logLevel as TLogLevelName,
    displayFilePath: "hidden",
  };

  if (["dev", "development", "debug"].includes(process.env.NODE_ENV)) {
    const devConfig = (await import("../config.dev.json")).default;
    config = { ...config, ...devConfig };
    log_config = { minLevel: config.logLevel as TLogLevelName };
  }

  Container.set("app.config", config);
  Container.set("discord.token", config.token);
  Container.set("app.version", version);

  Container.set(Logger, new Logger(log_config));
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

  // Other Commands
  Container.import([InfoCmd, RolesCmd, AvatarCmd, RobotCmd, CasinoRegisterCmd, ReloadCmd]);

  // Casino subcommands
  Container.import([CasinoProfileCmd, CasinoDailyCmd]);

  // Casino subcommand groups
  Container.import([CasinoBichoCmd, CasinoWalletCmd]);

  // Bicho subcommand group subcommands
  Container.import([CasinoBichoHelpCmd, CasinoBichoBetCmd]);

  // Wallet subcommand group subcommands
  Container.import([CasinoWalletSeeCmd, CasinoWalletTransferCmd]);
};
