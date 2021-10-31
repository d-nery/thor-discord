import Container from "typedi";

import { Client, MessageAttachment } from "discord.js";
import { Logger } from "tslog";
import { Inject, Service } from "typedi";
import { CasinoRepository } from "../CasinoRepository";
import { emojis, images } from "../../utils/entities";
import { DrawManager } from "./DrawManager";
import { ChipPositions, RouletteBet } from "../../model/casino/roulette";
import { sleep } from "../../utils/sleep";
import { createCanvas, loadImage } from "canvas";
import { Frame } from "../../utils/frame";

export type GuildBets = {
  available_colors: string[];
  players: {
    [playerId: string]: {
      color: string;
      bets: RouletteBet[];
    };
  };
};

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
      delete this.currentBets[guildId];
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

  async registerBet(guildId: string, userId: string, bet: RouletteBet): Promise<boolean> {
    if (!this.hasRunningGame) {
      return false;
    }

    const guild_bets = this.currentBets[guildId];

    if (guild_bets.available_colors.length == 0) {
      return false;
    }

    if (!(userId in guild_bets.players)) {
      guild_bets.players[userId] = {
        color: guild_bets.available_colors.pop(),
        bets: [],
      };
    }

    guild_bets.players[userId].bets.push(bet);

    this.logger.debug("nova aposta registrada", this.currentBets);

    return true;
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
    const repository = Container.get(CasinoRepository);
    repository.guildId = guildId;

    const guild_info = await repository.getGuildInfo();
    const roulette_channel = await this.client.channels.fetch(guild_info.roulette_channel_id);

    if (roulette_channel.isText()) {
      const img_msg = await roulette_channel.send(images.RouletteSpinning);
      const msg = await roulette_channel.send(`Apostas encerradas! Sorteando...`);
      await sleep(10000);
      await img_msg.edit(images.Roulette[draw]);
      await msg.edit(`Número sorteado: **${draw}**`);
    }
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
