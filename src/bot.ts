import { Client, User } from "discord.js";
import { Inject, Service } from "typedi";
import { Logger } from "tslog";

import { InteractionHandler } from "./services/InteractionHandler";
import { ReactionHandler } from "./services/ReactionHandler";

@Service()
export class Bot {
  @Inject()
  private readonly client: Client;

  @Inject("discord.token")
  private readonly token: string;

  @Inject()
  private readonly logger: Logger;

  @Inject()
  private readonly interactionHandler: InteractionHandler;

  @Inject()
  private readonly reactionHandler: ReactionHandler;

  async setup(): Promise<void> {
    this.logger.info("Setting up bot listeners");

    this.client.once("ready", async (client) => {
      await client.application.fetch();
      const bot_owner = client.application.owner as User;

      this.logger.info("Successfully logged into Discord");
      this.logger.info(`Bot username: ${client.user.username}`);
      this.logger.info(`Bot user ID: ${client.user.id}`);
      this.logger.info(`Bot owner: ${bot_owner.tag}`);
      this.logger.info(`Connected to Discord API`);
      this.logger.info(`Serving ${client.guilds.cache.size} guilds`);

      this.logger.info("Bot ready");
    });

    this.client.on("debug", (msg) => {
      this.logger.trace(`[client debug] ${msg}`);
    });

    this.client.on("warn", (msg) => {
      this.logger.warn(`[client warn] ${msg}`);
    });

    this.client.on("messageReactionAdd", async (reaction, user) => {
      try {
        await this.reactionHandler.handle({ reaction, user });
      } catch (err) {
        this.logger.error("Error running reaction handler", err);
      }
    });

    this.client.on("messageReactionRemove", async (reaction, user) => {
      try {
        await this.reactionHandler.handle({ reaction, user, removed: true });
      } catch (err) {
        this.logger.error("Error running reaction handler", err);
      }
    });

    this.client.on("interactionCreate", async (interaction) => {
      try {
        await this.interactionHandler.handle(interaction);
      } catch (err) {
        this.logger.error("Error running interaction", err);
      }
    });
  }

  async run(): Promise<void> {
    await this.client.login(this.token);
  }
}
