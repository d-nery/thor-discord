import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Logger } from "tslog";
import { Inject, InjectMany, Service, Token } from "typedi";
import { CommandPermission, ICommand, ISubCommand, ISubCommandGroup } from "../CommandManager";

export const CasinoSubCommandToken = new Token<ISubCommand>("commands.casino");
export const CasinoSubCommandGroupToken = new Token<ISubCommandGroup>("commands.casino[group]");

@Service()
export class CasinoCmd implements ICommand {
  readonly name: string = "casino";
  readonly description: string = "All casino commands";

  @Inject()
  private readonly logger: Logger;

  @InjectMany(CasinoSubCommandToken)
  private readonly subcommands: ISubCommand[];

  @InjectMany(CasinoSubCommandGroupToken)
  private readonly subcommandGroups: ISubCommandGroup[];

  async create(): Promise<SlashCommandBuilder> {
    const scb = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDefaultPermission(false);

    for (const subc of this.subcommandGroups) {
      scb.addSubcommandGroup(await subc.create());
    }

    for (const subc of this.subcommands) {
      scb.addSubcommand(await subc.create());
    }

    return scb;
  }

  permissions(role_id: string): [CommandPermission?] {
    return [
      {
        id: role_id,
        type: 1,
        permission: true,
      },
    ];
  }

  async run(interaction: CommandInteraction): Promise<void> {
    let subcommand: ISubCommandGroup | ISubCommand;

    try {
      subcommand = this.subcommandGroups.find((s) => s.name == interaction.options.getSubcommandGroup());
    } catch {
      subcommand = this.subcommands.find((s) => s.name == interaction.options.getSubcommand());
    }

    this.logger.debug("Received casino command", { user: interaction.user.tag, subcommand: subcommand.name });

    if (!subcommand) {
      throw "Invalid subcommand";
    }

    await subcommand.run(interaction);
  }
}
