import Container from "typedi";

import { Client, MessageAttachment } from "discord.js";
import { Logger } from "tslog";
import { Inject, Service } from "typedi";
import { CasinoRepository } from "../CasinoRepository";
import { emojis, images } from "../../utils/entities";
import { DrawManager } from "./DrawManager";
import { ChipPositions, RouletteBet, RoulettePayout, RoulettePossibleBetMap } from "../../model/casino/roulette";
import { sleep } from "../../utils/sleep";
import { createCanvas, loadImage } from "canvas";
import { Frame } from "../../utils/frame";
import { BalanceError } from "./CasinoManager";

export type GuildBets = {
  available_colors: string[];
  players: {
    [playerId: string]: {
      color: string;
      bets: RouletteBet[];
    };
  };
};

export class TooManyPlayersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TooManyPlayersError";
  }
}

type GuildBetsCollection = {
  [guildId: string]: GuildBets;
};

@Service()
export class RouletteManager {
  @Inject()
  private readonly drawManager: DrawManager;

  @Inject()
  private readonly logger: Logger;

  @Inject()
  private readonly client: Client;

  private currentBets: GuildBetsCollection = {};

  async startRoulette(guildId: string): Promise<void> {
    await this.drawManager.scheduleRouletteDraw(guildId, async (draw) => {
      await this.announceResult(guildId, draw);
    });

    this.currentBets[guildId] = {
      available_colors: Object.keys(emojis.Chips),
      players: {},
    };

    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const guild_info = await repository.getGuildInfo();
    const roulette_channel = await this.client.channels.fetch(guild_info.roulette_channel_id);

    const game_state = await this.buildGameImage(guildId);

    if (roulette_channel.isText()) {
      await roulette_channel.send({
        content: "Novo Jogo! Façam suas apostas!",
        files: [game_state],
      });
    }
  }

  hasRunningGame(guildId: string): boolean {
    return guildId in this.currentBets;
  }

  async registerBet(guildId: string, userId: string, bet: RouletteBet): Promise<Error> {
    if (!this.hasRunningGame) {
      return new Error("No game running");
    }

    const guild_bets = this.currentBets[guildId];

    if (guild_bets.available_colors.length == 0) {
      return new TooManyPlayersError("too many players");
    }

    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const player_info = await repository.getPlayerInfo(userId);

    if (player_info.tb < bet.value) {
      return new BalanceError("Not enough balance");
    }

    if (!(userId in guild_bets.players)) {
      guild_bets.players[userId] = {
        color: guild_bets.available_colors.pop(),
        bets: [],
      };
    }

    guild_bets.players[userId].bets.push(bet);

    this.logger.debug("nova aposta registrada", this.currentBets);

    return null;
  }

  async announceBet(guildId: string): Promise<void> {
    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const guild_info = await repository.getGuildInfo();
    const roulette_channel = await this.client.channels.fetch(guild_info.roulette_channel_id);

    const players_msg = await Promise.all(
      Object.entries(this.currentBets[guildId].players).map(async ([id, p]) => {
        const user = await this.client.users.fetch(id);

        return `${emojis.Chips[p.color]} ${user}`;
      })
    );

    const game_state = await this.buildGameImage(guildId);

    if (roulette_channel.isText()) {
      await roulette_channel.send({
        content: `Nova Aposta! Jogo atual:\n${players_msg.join("\n")}`,
        files: [game_state],
      });
    }
  }

  async announceResult(guildId: string, draw: number): Promise<void> {
    this.logger.debug("start processing roulette results", { guildId, draw });
    const bets = this.currentBets[guildId];
    delete this.currentBets[guildId];

    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const guild_info = await repository.getGuildInfo();
    const roulette_channel = await this.client.channels.fetch(guild_info.roulette_channel_id);

    if (!roulette_channel.isText()) {
      return;
    }

    const img_msg = await roulette_channel.send(images.RouletteSpinning);
    const msg = await roulette_channel.send(`Apostas encerradas! Sorteando...`);
    const sleeping = sleep(10000);

    const prizes = this.calculatePrizes(bets, draw);
    const prize_announce = [];

    for (const { player: pid, tb } of prizes) {
      const player = await this.client.users.fetch(pid);
      await repository.addPlayerTb(pid, tb);

      prize_announce.push(`${player}: ${emojis.TB} ${tb}`);
      this.logger.debug("added roulette plyer prize", { tag: player.tag, pid, tb });
    }

    await sleeping;
    await img_msg.edit(images.Roulette[draw]);
    await msg.edit(`Número sorteado: **${draw}**\n${prize_announce.join("\n")}`);
  }

  private calculatePrizes(bets: GuildBets, draw: number): { player: string; tb: number }[] {
    const prizes = Object.entries(bets.players).map(([pid, bet]) => ({
      player: pid,
      tb: bet.bets.reduce((acc, v) => {
        const actualBet = RoulettePossibleBetMap[v.type][v.bet];
        acc += actualBet.includes(draw) ? RoulettePayout[v.type] * v.value : -v.value;

        return acc;
      }, 0),
    }));

    return prizes;
  }

  private async buildGameImage(guildId: string): Promise<MessageAttachment> {
    const canvas = createCanvas(1400, 568);
    const ctx = canvas.getContext("2d");

    const table = await loadImage("./static/img/roulette_table.png");

    ctx.drawImage(table, 0, 0, canvas.width, canvas.height);

    for (const p of Object.values(this.currentBets[guildId].players)) {
      const chip = emojis.Chips[p.color];
      const image = await loadImage(`./static/img/chips/${chip.name}.png`);

      for (const b of p.bets) {
        const frame: Frame = ChipPositions[b.type][b.bet];

        frame.putInsideRandom(ctx, image);
      }
    }

    return new MessageAttachment(canvas.toBuffer(), "table.png");
  }
}
