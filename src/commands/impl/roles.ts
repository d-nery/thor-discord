import { SlashCommandBuilder } from "@discordjs/builders";
import { Logger } from "tslog";
import { CommandInteraction, Message } from "discord.js";
import { Inject, Service } from "typedi";

import { ConfigRepositoryToken } from "../../services/ConfigRepository";
import { CommandToken, ICommand } from "../command";
import { Config, ConfigKey } from "../../model/config";
import { IRepository } from "../../services/services";

@Service({ id: CommandToken, multiple: true })
export class RolesCmd implements ICommand {
  @Inject(ConfigRepositoryToken)
  private readonly configRepository: IRepository<ConfigKey, Config>;

  @Inject("logger")
  private readonly logger: Logger;

  readonly name: string = "roles";
  readonly description: string = "Info about the bot";

  create(): SlashCommandBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description); //.setDefaultPermission(false);
  }

  permissions(owner_id: string): [{ id: string; type: string; permission: boolean }?] {
    return [
      {
        id: owner_id,
        type: "USER",
        permission: true,
      },
    ];
  }

  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();

    const { channel, guild } = interaction;
    const emojis = await guild.emojis.fetch();
    const roles = await guild.roles.fetch();
    const emoji_roles = (await this.configRepository.get(guild.id)).roles ?? [];

    let text = "Reaja abaixo para escolher um cargo de jogo e receber notificação se mencionarem!\n\n";

    for (const role of emoji_roles) {
      text = text.concat(`${emojis.get(role.eid)} ${roles.get(role.rid)} -> ${role.description}\n`);
    }

    const reply = (await interaction.editReply({ content: text })) as Message;

    for (const { eid } of emoji_roles) {
      await reply.react(eid);
    }

    this.logger.debug(`Updating DB with new channel and message ID`);

    await this.configRepository.set(guild.id, ConfigKey.ROLES_CID, { [ConfigKey.ROLES_CID]: channel.id });
    await this.configRepository.set(guild.id, ConfigKey.ROLES_MID, { [ConfigKey.ROLES_MID]: reply.id });
  }
}
