import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Inject, Service } from "typedi";
import { Daily } from "../../model/casino/player";
import { CasinoManager, DailyError } from "../../services/casino";
import { ISubCommand } from "../CommandManager";
import { CasinoSubCommandToken } from ".";

@Service({ id: CasinoSubCommandToken, multiple: true })
export class CasinoDailyCmd implements ISubCommand {
  readonly name: string = "daily";
  readonly description: string = "Receba sua recompensa diária do casino!";

  @Inject()
  private readonly casinoManager: CasinoManager;

  async create(): Promise<SlashCommandSubcommandBuilder> {
    return new SlashCommandSubcommandBuilder().setName(this.name).setDescription(this.description);
  }

  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();

    let streak: Daily;

    try {
      streak = await this.casinoManager.registerPlayerDaily(interaction.guildId, interaction.user.id);
    } catch (err) {
      if (err instanceof DailyError) {
        await interaction.editReply("Você já se registrou hoje!");
        return;
      }

      throw err;
    }

    await interaction.editReply(`${streak.last.toDate().toString()} - ${streak.streak}`);
  }
}
