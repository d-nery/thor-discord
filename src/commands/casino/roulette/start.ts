import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Logger } from "tslog";
import { Inject, Service } from "typedi";
import { RouletteManager } from "../../../services/casino/RouletteManager";
import { ISubCommand } from "../../CommandManager";

import { CasinoRouletteSubCommandToken } from "./roulette";

@Service({ id: CasinoRouletteSubCommandToken, multiple: true })
export class CasinoRuletteStartCmd implements ISubCommand {
  readonly name: string = "start";
  readonly description: string = "Start a roulette game";

  @Inject()
  private readonly rouletteManager: RouletteManager;

  @Inject()
  private readonly logger: Logger;

  async create(): Promise<SlashCommandSubcommandBuilder> {
    return new SlashCommandSubcommandBuilder().setName(this.name).setDescription(this.description);
  }

  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    try {
      await this.rouletteManager.startRoulette(interaction.guildId);
      await interaction.editReply("Prontoo");
    } catch (e) {
      await interaction.editReply("ja tem um jogo bla bla");
    }
  }
}
