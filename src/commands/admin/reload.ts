import { SlashCommandBuilder } from "@discordjs/builders";
import { Logger } from "tslog";
import { CommandInteraction } from "discord.js";
import Container, { Inject, Service } from "typedi";

import { CommandManager, CommandPermission, CommandToken, ICommand } from "../CommandManager";
import { CasinoRepository } from "../../services/CasinoRepository";

@Service({ id: CommandToken, multiple: true })
export class ReloadCmd implements ICommand {
  @Inject()
  private readonly commandManager: CommandManager;

  @Inject()
  private readonly logger: Logger;

  readonly name: string = "reload";
  readonly description: string = "Reload casino commands in this guild";

  async create(): Promise<SlashCommandBuilder> {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description).setDefaultPermission(false);
  }

  permissions(owner_id: string): [CommandPermission?] {
    return [
      {
        id: owner_id,
        type: 2,
        permission: true,
      },
    ];
  }

  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const repository = Container.get(CasinoRepository);
    repository.guildId = interaction.guildId;

    const casino_role = (await repository.getGuildInfo()).role_id;
    await this.commandManager.registerCasinoCommands(interaction.guildId, casino_role);

    await interaction.editReply("Done");
  }
}
