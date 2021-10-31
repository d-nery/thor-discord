import { SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { InjectMany, Service, Token } from "typedi";
import { ISubCommand, ISubCommandGroup } from "../../CommandManager";
import { CasinoSubCommandGroupToken } from "../casino";

export const CasinoRouletteSubCommandToken = new Token<ISubCommand>("commands.casino.roulette");

@Service({ id: CasinoSubCommandGroupToken, multiple: true })
export class CasinoRouletteCmd implements ISubCommandGroup {
  readonly name: string = "roulette";
  readonly description: string = "All casino roulette commands";

  @InjectMany(CasinoRouletteSubCommandToken)
  private readonly subcommands: ISubCommand[];

  async create(): Promise<SlashCommandSubcommandGroupBuilder> {
    const scb = new SlashCommandSubcommandGroupBuilder().setName(this.name).setDescription(this.description);

    for (const subc of this.subcommands) {
      scb.addSubcommand(await subc.create());
    }

    return scb;
  }

  async run(interaction: CommandInteraction): Promise<void> {
    const subcommand = this.subcommands.find((s) => s.name == interaction.options.getSubcommand());
    if (!subcommand) {
      throw new Error("Invalid subcommand");
    }

    await subcommand.run(interaction);
  }
}
