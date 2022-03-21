import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Logger } from "tslog";
import Container, { Inject, Service } from "typedi";
import { CasinoRepository } from "../../../services";
import { emojis } from "../../../utils/entities";
import { ISubCommand } from "../../CommandManager";

import { CasinoWalletSubCommandToken } from "./wallet";

@Service({ id: CasinoWalletSubCommandToken, multiple: true })
export class CasinoWalletSeeCmd implements ISubCommand {
  readonly name: string = "see";
  readonly description: string = "See your balance";

  @Inject()
  private readonly logger: Logger;

  async create(): Promise<SlashCommandSubcommandBuilder> {
    return new SlashCommandSubcommandBuilder().setName(this.name).setDescription(this.description);
  }

  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();

    const repository = Container.get(CasinoRepository);
    repository.guildId = interaction.guildId;

    const playerInfo = await repository.getPlayerInfo(interaction.user.id);

    await interaction.editReply(`${emojis.TB} ${playerInfo.tb}`);
  }
}
