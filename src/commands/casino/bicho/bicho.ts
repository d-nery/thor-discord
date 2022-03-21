import { SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { InjectMany, Service, Token } from "typedi";
import { ISubCommand, ISubCommandGroup } from "../../CommandManager";
import { CasinoSubCommandGroupToken } from "../casino";

export const CasinoBichoSubCommandToken = new Token<ISubCommand>("commands.casino.bicho");

@Service({ id: CasinoSubCommandGroupToken, multiple: true })
export class CasinoBichoCmd implements ISubCommandGroup {
  readonly name: string = "bicho";
  readonly description: string = "All casino robot_game commands";

  @InjectMany(CasinoBichoSubCommandToken)
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
      throw "Invalid subcommand";
    }

    await subcommand.run(interaction);
  }
}
