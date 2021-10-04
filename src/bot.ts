import { Client, Interaction } from "discord.js";
import { Inject, Service } from "typedi";
import { Logger } from "tslog";

import { InteractionHandlerToken } from "./services/InteractionHandler";
import { ReactionEvent, ReactionHandlerToken } from "./services/ReactionHandler";
import { IHandler } from "./services/services";

@Service()
export class Bot {
  @Inject("discord.client")
  private readonly client: Client;

  @Inject("discord.token")
  private readonly token: string;

  @Inject("logger")
  private readonly logger: Logger;

  @Inject(InteractionHandlerToken)
  private readonly interactionHandler: IHandler<Interaction>;

  @Inject(ReactionHandlerToken)
  private readonly reactionHandler: IHandler<ReactionEvent>;

  async setup(): Promise<void> {
    this.logger.info("Setting up bot listeners");

    this.client.once("ready", (client) => {
      const bot_owner = client.application.owner;

      this.logger.info("Successfully logged into Discord");
      this.logger.info(`Bot username: ${client.user.username}`);
      this.logger.info(`Bot user ID: ${client.user.id}`);
      this.logger.info(`Bot owner: ${bot_owner}`);
      this.logger.info(`Connected to Discord API`);
      this.logger.info(`Serving ${client.guilds.cache.size} guilds`);

      this.logger.info("Bot ready");
    });

    this.client.on("debug", (msg) => {
      this.logger.trace(`[client debug] ${msg}`);
    });

    this.client.on("messageReactionAdd", async (reaction, user) => {
      await this.reactionHandler.handle({ reaction, user });
    });

    this.client.on("messageReactionRemove", async (reaction, user) => {
      await this.reactionHandler.handle({ reaction, user, removed: true });
    });

    this.client.on("interactionCreate", async (interaction) => {
      await this.interactionHandler.handle(interaction);
    });
  }

  async run(): Promise<void> {
    await this.client.login(this.token);
  }
}
