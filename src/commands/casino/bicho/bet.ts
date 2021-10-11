import {
  SlashCommandBooleanOption,
  SlashCommandIntegerOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { Logger } from "tslog";
import Container, { Inject, Service } from "typedi";
import { BichoBetType } from "../../../model/casino/bicho";
import { BichoManager } from "../../../services/casino/BichoManager";
import { CasinoRepository } from "../../../services/CasinoRepository";
import { ISubCommand } from "../../CommandManager";

import { CasinoBichoSubCommandToken } from "./bicho";

@Service({ id: CasinoBichoSubCommandToken, multiple: true })
export class CasinoBichoBetCmd implements ISubCommand {
  readonly name: string = "bet";
  readonly description: string = 'Bet in the next "bicho" game';

  @Inject()
  private readonly bichoManager: BichoManager;

  @Inject()
  private readonly logger: Logger;

  async create(): Promise<SlashCommandSubcommandBuilder> {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption(
        new SlashCommandIntegerOption().setName("amount").setDescription("Amount of TB to bet").setRequired(true)
      )
      .addStringOption(
        new SlashCommandStringOption()
          .setName("type")
          .setDescription("Type of bet")
          .addChoices([
            ["Grupo", BichoBetType.GROUP],
            ["Dezena", BichoBetType.DEZENA],
            ["Centena", BichoBetType.CENTENA],
            ["Milhar", BichoBetType.MILHAR],
          ])
          .setRequired(true)
      )
      .addIntegerOption(
        new SlashCommandIntegerOption().setName("bet").setDescription("The number you want to bet").setRequired(true)
      )
      .addBooleanOption(new SlashCommandBooleanOption().setName("cerca").setDescription("Apostar na cerca?"));
  }

  async run(interaction: CommandInteraction): Promise<void> {
    const user = interaction.user;
    const amount = interaction.options.getInteger("amount", true);
    const type = interaction.options.getString("type", true) as BichoBetType;
    const bet = interaction.options.getInteger("bet", true);
    const cerca = interaction.options.getBoolean("cerca") ?? false;

    const bicho_bet = { amount, type, bet, cerca };

    if (!this.bichoManager.validateBet(bicho_bet)) {
      await interaction.reply({
        content: "Aposta inválida! Cheque seus valores. Use `/casino bicho help` Se precisar de ajuda.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const repository = Container.get(CasinoRepository);
    repository.guildId = interaction.guildId;

    const player_info = await repository.getPlayerInfo(user.id);

    if (player_info.tb < amount) {
      await interaction.editReply({
        content: `Você não tem TB suficiente! Seu saldo: TB ${player_info.tb}`,
      });
      return;
    }

    if (player_info.bet != null) {
      await interaction.editReply({
        embeds: [
          new MessageEmbed()
            .setDescription("Você já tem uma aposta registrada para hoje!")
            .addField("Tipo", `${player_info.bet.type}`, true)
            .addField("Número", `${player_info.bet.bet}`, true)
            .addField("Valor", `T฿ ${player_info.bet.amount}`, true)
            .addField("Cerca", player_info.bet.cerca ? "Sim" : "Não", true),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setDescription("Você confirma essa aposta? Não é possível retirar nem modificar sua aposta até o sorteio!")
          .addField("Tipo", `${bicho_bet.type}`, true)
          .addField("Número", `${bicho_bet.bet}`, true)
          .addField("Valor", `T฿ ${bicho_bet.amount}`, true)
          .addField("Cerca", bicho_bet.cerca ? "Sim" : "Não", true)
          .setFooter("Você tem 30 segundos para confirmar sua aposta."),
      ],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId(`casino-bet:${interaction.user.id}:confirm`)
            .setLabel("Confirmar")
            .setStyle("SUCCESS"),
          new MessageButton()
            .setCustomId(`casino-bet:${interaction.user.id}:cancel`)
            .setLabel("Cancelar")
            .setStyle("DANGER")
        ),
      ],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === user.id,
      time: 30000,
    });

    collector.once("collect", async (i) => {
      if (i.customId.endsWith("confirm")) {
        try {
          await this.bichoManager.registerBet(interaction.guildId, user.id, bicho_bet);
          this.logger.info("Aposta registrada", { guildId: interaction.guildId, user: user.id, bet: bicho_bet });
          await interaction.editReply({ content: "Aposta registrada!", embeds: [], components: [] });
          await this.bichoManager.announceBet(interaction.guildId, user.id, bicho_bet);
        } catch (err) {
          this.logger.error("error on bet registering", err);
        }
      } else {
        await interaction.editReply({
          content: "aposta cancelada, pode fazer novamente com `/casino bicho bet`",
          embeds: [],
          components: [],
        });
      }

      collector.removeAllListeners("end");
    });

    collector.once("end", async () => {
      await interaction.editReply({
        content: "aposta cancelada, pode fazer novamente com `/casino bicho bet`",
        embeds: [],
        components: [],
      });
    });
  }
}
