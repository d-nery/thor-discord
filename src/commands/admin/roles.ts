import { SlashCommandBuilder } from "@discordjs/builders";
import { Logger } from "tslog";
import { CommandInteraction, Message } from "discord.js";
import { Inject, Service } from "typedi";

import { ConfigRepository } from "../../services";
import { CommandPermission, CommandToken, ICommand } from "../CommandManager";
import { ConfigKey } from "../../model/config";

@Service({ id: CommandToken, multiple: true })
export class RolesCmd implements ICommand {
  @Inject()
  private readonly configRepository: ConfigRepository;

  @Inject()
  private readonly logger: Logger;

  readonly name: string = "roles";
  readonly description: string = "Creates role list that members can interact to get game roles";

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
    await interaction.deferReply();

    const { channel, guild } = interaction;
    const emojis = await guild.emojis.fetch();
    const roles = await guild.roles.fetch();
    const emoji_roles = (await this.configRepository.get(guild.id))?.roles ?? [];

    if (emoji_roles.length == 0) {
      await interaction.editReply("No roles defined for this guild!");
      return;
    }

    let text = "Reaja abaixo para escolher um cargo de jogo e receber notificação se mencionarem!\n\n";

    for (const role of emoji_roles) {
      text = text.concat(`${emojis.get(role.eid)} ${roles.get(role.rid)} -> ${role.description}\n`);
    }

    const reply = (await interaction.editReply({ content: text })) as Message;

    for (const { eid } of emoji_roles) {
      await reply.react(eid);
    }

    this.logger.debug(`Updating DB with new channel and message ID`);

    await this.configRepository.set(guild.id, ConfigKey.ROLES_CID, channel.id);
    await this.configRepository.set(guild.id, ConfigKey.ROLES_MID, reply.id);
  }
}
