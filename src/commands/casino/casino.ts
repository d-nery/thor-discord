import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import Container, { Inject, Service, Token } from "typedi";
import { CasinoRepository } from "../../services/CasinoRepository";
import { CommandPermission, ICommand, ISubCommand } from "../CommandManager";

export const CasinoCommandToken = new Token<ISubCommand>("commands.casino");

@Service()
export class CasinoCmd implements ICommand {
  readonly name: string = "casino";
  readonly description: string = "All casino commands";
  private readonly subcommands: ISubCommand[];

  constructor() {
    this.subcommands = Container.getMany(CasinoCommandToken);
  }

  async create(): Promise<SlashCommandBuilder> {
    const scb = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDefaultPermission(false);

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
    const subcommand = this.subcommands.find((s) => s.name == interaction.options.getSubcommand());
    if (!subcommand) {
      throw "Invalid subcommand";
    }

    subcommand.run(interaction);
  }
}
