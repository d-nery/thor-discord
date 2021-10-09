import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember, Message, MessageActionRow, MessageButton, Permissions } from "discord.js";
import Container, { Inject, Service } from "typedi";
import { CasinoManager } from "../../services/casino/CasinoManager";
import { CasinoRepository } from "../../services/CasinoRepository";
import { CommandPermission, CommandToken, ICommand } from "../CommandManager";

@Service({ id: CommandToken, multiple: true })
export class CasinoRegisterCmd implements ICommand {
  readonly name: string = "casino_register";
  readonly description: string = "Register into the casino";

  @Inject()
  private readonly casinoManager: CasinoManager;

  async create(): Promise<SlashCommandBuilder> {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  permissions(_owner_id: string): [CommandPermission?] {
    return [];
  }

  async run(interaction: CommandInteraction): Promise<void> {
    const repository = Container.get(CasinoRepository);
    repository.guildId = interaction.guildId;

    const user = interaction.member as GuildMember;

    if (!(await repository.guildRegistered())) {
      if (!user.permissions.has(Permissions.FLAGS.MANAGE_GUILD, true)) {
        interaction.reply({
          content: "Opa! O cassino não está habilitado nesse servidor, somente admins podem habilitá-lo!",
          ephemeral: true,
        });

        return;
      }

      await interaction.reply({
        content:
          "Olá! O casino ainda não foi habilitado nesse servidor, deseja habilitá-lo?\n" +
          "Isso vai criar novos canais e roles, além de registrar você nele.",
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setCustomId(`casino-register-guild:${interaction.guildId}:confirm`)
              .setLabel("Confirmar")
              .setStyle("SUCCESS"),
            new MessageButton()
              .setCustomId(`casino-register-guild:${interaction.guildId}:cancel`)
              .setLabel("Cancelar")
              .setStyle("DANGER")
          ),
        ],
        ephemeral: true,
      });

      const collector = interaction.channel.createMessageComponentCollector({
        filter: (i) => i.user.id === user.id,
        time: 60000,
      });

      collector.once("collect", async (i) => {
        if (i.customId.endsWith("confirm")) {
          await interaction.editReply({ content: "Show! Criando tudo que é necessário...", components: [] });
          await interaction.followUp({
            content:
              "Olá! O ThunderCasino está sendo habilitado nesse servidor!\n" +
              "Para se registrar nele e ter acesso aos canais, use o comando `/casino_register`",
          });

          this.casinoManager.guildFirstTime(interaction.guildId);
        } else {
          await interaction.editReply({ content: "Ok, não irei habilitar o cassino", components: [] });
        }

        collector.removeAllListeners("end");
      });

      collector.once("end", async () => {
        await interaction.editReply({ content: "Ok, não irei habilitar o cassino", components: [] });
      });

      return;
    }

    interaction.reply("NYI");
  }
}
