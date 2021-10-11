import { Client, Permissions } from "discord.js";
import { Logger } from "tslog";
import Container, { Inject, Service } from "typedi";
import { CasinoBichoHelpCmd } from "../../commands/casino/bicho/help";
import { CommandManager } from "../../commands/CommandManager";
import { GuildInfo } from "../../model/casino/guild_info";
import { CasinoRepository } from "../CasinoRepository";

@Service()
export class CasinoManager {
  @Inject()
  private readonly client: Client;

  @Inject()
  private readonly logger: Logger;

  @Inject()
  private readonly commandManager: CommandManager;

  async guildFirstTime(guildId: string): Promise<void> {
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

    const lobby_channel = await guild.channels.create("lobby", {
      type: "GUILD_TEXT",
      parent: casino_category,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [Permissions.FLAGS.SEND_MESSAGES],
        },
      ],
    });

    this.logger.info("Created lobby channel", {
      guild: { id: guild.id, name: guild.name },
      channel: lobby_channel.id,
    });

    const bicho_channel = await guild.channels.create("jogo-do-bicho", {
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

    await repository.registerGuild(
      new GuildInfo(casino_role.id, casino_category.id, lobby_channel.id, bicho_channel.id)
    );
    await lobby_channel.send(
      "Olá! Casino blabla bla use /casino_register para entrar etc <explicação de cada comando>"
    );
    await bicho_channel.send(CasinoBichoHelpCmd.cartela);
    await bicho_channel.send(CasinoBichoHelpCmd.helpText[0]);
    await bicho_channel.send(CasinoBichoHelpCmd.helpText[1]);
    await this.commandManager.registerCasinoCommands(guildId, casino_role.id);
  }

  async registerPlayer(guildId: string, playerId: string): Promise<void> {
    const guild = this.client.guilds.cache.get(guildId);

    if (!guild) {
      throw "Guild not found!";
    }

    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const guild_info = await repository.getGuildInfo();

    await repository.registerPlayer(playerId);
    const guild_member = guild.members.cache.get(playerId);

    if (!guild_member) {
      throw "Guild member not found";
    }

    await guild_member.roles.add(guild_info.role_id);
    this.logger.info("Added casino role to guild member", { guild: guildId, player: playerId });
  }
}
