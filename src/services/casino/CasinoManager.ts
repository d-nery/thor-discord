import dayjs from "dayjs";
import isYesterday from "dayjs/plugin/isYesterday";
import isToday from "dayjs/plugin/isToday";

dayjs.extend(isYesterday);
dayjs.extend(isToday);

import { Client, Permissions } from "discord.js";
import { Logger } from "tslog";
import Container, { Inject, Service } from "typedi";
import { CasinoBichoHelpCmd } from "../../commands/casino/bicho/help";
import { CommandManager } from "../../commands/CommandManager";
import { GuildInfo } from "../../model/casino/guild_info";
import { Daily } from "../../model/casino/player";
import { CasinoRepository } from "../CasinoRepository";
import { Timestamp } from "@google-cloud/firestore";

export class DailyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DailyError";
  }
}

export class BalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BalanceError";
  }
}

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

    const roulette_channel = await guild.channels.create("roleta", {
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
      new GuildInfo(casino_role.id, casino_category.id, lobby_channel.id, roulette_channel.id, bicho_channel.id)
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

  async registerPlayerDaily(guildId: string, playerId: string): Promise<Daily> {
    const now = dayjs();
    const guild = this.client.guilds.cache.get(guildId);

    if (!guild) {
      throw "Guild not found!";
    }

    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const player_info = await repository.getPlayerInfo(playerId);
    const daily = player_info.daily;
    const last = dayjs(daily.last.toDate());

    if (last.isToday()) {
      throw new DailyError("current last is today");
    }

    const streak = last.isYesterday() ? (daily.streak % 7) + 1 : 1;

    const new_data: Daily = {
      last: new Timestamp(now.unix(), 0),
      streak: streak,
    };

    await Promise.all([repository.setDailyStreak(playerId, new_data), repository.addPlayerTb(playerId, streak * 10)]);

    this.logger.info("player registered for daily bonus", { playerId, streak: new_data });

    return new_data;
  }

  async transferBalance(guildId: string, from: string, to: string, amount: number): Promise<number> {
    if (amount < 0) {
      throw new RangeError("amount cannot be negative");
    }

    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const fromPlayer = await repository.getPlayerInfo(from);

    if (fromPlayer.tb < amount) {
      throw new BalanceError("not enough TB on player's account");
    }

    await Promise.all([repository.addPlayerTb(from, -amount), repository.addPlayerTb(to, amount)]);

    this.logger.info("transferred balance", { from, to, amount });

    const updateFromPlayer = await repository.getPlayerInfo(from);
    return updateFromPlayer.tb;
  }
}
