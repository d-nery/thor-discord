import Container from "typedi";

import { Client, MessageEmbed } from "discord.js";
import { Logger } from "tslog";
import { Inject, Service } from "typedi";
import { BichoBet, BichoBetType, BichoGroupMap } from "../../model/casino/bicho";
import { CasinoRepository } from "../CasinoRepository";

@Service()
export class BichoManager {
  @Inject()
  private readonly logger: Logger;

  @Inject()
  private readonly client: Client;

  private static MaxBetMap = {
    [BichoBetType.GROUP]: 25,
    [BichoBetType.DEZENA]: 99,
    [BichoBetType.CENTENA]: 999,
    [BichoBetType.MILHAR]: 9999,
  };

  private static MinBetMap = {
    [BichoBetType.GROUP]: 1,
    [BichoBetType.DEZENA]: 0,
    [BichoBetType.CENTENA]: 0,
    [BichoBetType.MILHAR]: 0,
  };

  validateBet(bet: BichoBet): boolean {
    if (bet.amount <= 0) {
      return false;
    }

    const max_bet = BichoManager.MaxBetMap[bet.type];
    const min_bet = BichoManager.MinBetMap[bet.type];

    return bet.bet >= min_bet && bet.bet <= max_bet;
  }

  async registerBet(guildId: string, userId: string, bet: BichoBet): Promise<void> {
    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const player_info = await repository.getPlayerInfo(userId);

    await repository.setPlayerTb(userId, player_info.tb - bet.amount);
    await repository.setBichoBet(userId, bet);
  }

  async announceBet(guildId: string, userId: string, bet: BichoBet): Promise<void> {
    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const user = await this.client.users.fetch(userId);
    const guild_info = await repository.getGuildInfo();

    const bicho_channel = await this.client.channels.fetch(guild_info.bicho_channel_id);
    if (bicho_channel.isText()) {
      await bicho_channel.send({
        embeds: [
          new MessageEmbed()
            .setAuthor(user.username, user.avatarURL())
            .setTitle("Nova Aposta!")
            .addField("Tipo", `${bet.type}`, true)
            .addField("Número", `${bet.bet}`, true)
            .addField("Valor", `T฿ ${bet.amount}`, true)
            .addField("Cerca", bet.cerca ? "Sim" : "Não", true),
        ],
      });
    }
  }

  async processDraw(raw_draw: number[], dezenas: number[], centenas: number[], milhares: number[]): Promise<void> {
    this.logger.debug("Starting draw processing");
    const repository = Container.get(CasinoRepository);

    const guild_list = await repository.getGuildList();

    const groups = dezenas.map((d) => (d === 0 ? 25 : Math.ceil(d / 4)));

    const formattedDraw = raw_draw.map((d) => "`" + String(d).padStart(2, "0") + "`");
    const formattedGroups = groups.map((d) => "`" + `(${String(d).padStart(2, " ")} - ${BichoGroupMap[d]})` + "`");

    for (const guildId of guild_list) {
      const repository = Container.get(CasinoRepository);
      repository.guildId = guildId;

      const result_embed = new MessageEmbed()
        .setTitle("Jogo do Bicho")
        .setDescription("As dezenas foram sorteadas!")
        .addField("Série 1 (Cabeça)", `${formattedDraw[0]} ${formattedDraw[1]} - ${formattedGroups[0]}`)
        .addField("Série 2", `${formattedDraw[2]} ${formattedDraw[3]} - ${formattedGroups[1]}`)
        .addField("Série 3", `${formattedDraw[4]} ${formattedDraw[5]} - ${formattedGroups[2]}`)
        .addField("Série 4", `${formattedDraw[6]} ${formattedDraw[7]} - ${formattedGroups[3]}`)
        .addField("Série 5", `${formattedDraw[8]} ${formattedDraw[9]} - ${formattedGroups[4]}`);

      const guild_players = await repository.getPlayerWithBetsList();
      let winners = [];

      const get_prize = (bet: BichoBet, multiplier: number) =>
        Math.ceil((bet.amount * multiplier) / (bet.cerca ? 5 : 1));

      const type_mult_results_map: [type: BichoBetType, mult: number, results: number[]][] = [
        [BichoBetType.GROUP, 15, groups],
        [BichoBetType.DEZENA, 25, dezenas],
        [BichoBetType.CENTENA, 50, centenas],
        [BichoBetType.MILHAR, 100, milhares],
      ];

      for (const player of guild_players) {
        const player_info = await repository.getPlayerInfo(player);
        const user = await this.client.users.fetch(player);
        const bet = player_info.bet;

        const [type, mult, results] = type_mult_results_map.find(([type]) => type === bet.type);

        if (bet.cerca ? results.includes(bet.bet) : results[0] === bet.bet) {
          const prize = get_prize(bet, mult);
          await repository.setPlayerTb(player, player_info.tb + prize);
          winners = winners.concat(
            `${user} - ${type} ${bet.bet} [${bet.cerca ? "Cerca" : "Cabeça"}] - Ganhou T฿ ${prize}`
          );
        }

        await repository.resetBichoBet(player);
      }

      const winners_embed = new MessageEmbed()
        .setTitle("Ganhadores")
        .setDescription(winners.length > 0 ? winners.join("\n") : "Ninguém ganhou :(");

      const guild_info = await repository.getGuildInfo();
      const bicho_channel = this.client.channels.cache.get(guild_info.bicho_channel_id);
      if (bicho_channel.isText()) {
        await bicho_channel.send({
          embeds: [result_embed, winners_embed],
        });
      }
    }
  }
}
