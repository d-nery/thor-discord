import { Client, Permissions } from "discord.js";
import { Logger } from "tslog";
import Container, { Inject, Service } from "typedi";
import { GuildInfo } from "../../model/casino/guild_info";
import { CasinoRepository } from "../CasinoRepository";

@Service()
export class CasinoManager {
  @Inject()
  private readonly client: Client;

  @Inject()
  private readonly logger: Logger;

  public async guildFirstTime(guildId: string): Promise<void> {
    const guild = this.client.guilds.cache.get(guildId);

    if (!guild) {
      throw "Guild not found!";
    }

    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const casino_role = await guild.roles.create({
      name: "ThunderCasino",
      color: "DARK_ORANGE",
      reason: "Created for ThunderCasino permissions and management",
    });

    this.logger.info("Created casino role", { guild: { id: guild.id, name: guild.name }, role: casino_role.id });

    const casino_category = await guild.channels.create("ThunderCasino", {
      type: "GUILD_CATEGORY",
    });

    this.logger.info("Created casino category", {
      guild: { id: guild.id, name: guild.name },
      category: casino_category.id,
    });

    const lobby_channel = await guild.channels.create("Lobby", {
      type: "GUILD_TEXT",
      parent: casino_category,
    });

    this.logger.info("Created lobby channel", {
      guild: { id: guild.id, name: guild.name },
      channel: lobby_channel.id,
    });

    repository.registerGuild(new GuildInfo(casino_role.id, casino_category.id, lobby_channel.id));

    await guild.channels.create("test-hidden", {
      type: "GUILD_TEXT",
      parent: casino_category,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [Permissions.FLAGS.VIEW_CHANNEL],
        },
        {
          id: casino_role.id,
          allow: [Permissions.FLAGS.VIEW_CHANNEL],
        },
      ],
    });

    await guild.channels.create("test-hidden-no-write", {
      type: "GUILD_TEXT",
      parent: casino_category,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES],
        },
        {
          id: casino_role.id,
          allow: [Permissions.FLAGS.VIEW_CHANNEL],
        },
      ],
    });
  }
}
