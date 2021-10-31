import {
  SlashCommandIntegerOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders";
import { stripIndents } from "common-tags";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } from "discord.js";
import { Logger } from "tslog";
import { Inject, Service } from "typedi";
import _ from "underscore";
import { RouletteBetType, RoulettePossibleBetFriendlyNameMap } from "../../../model/casino/roulette";
import { RouletteManager } from "../../../services/casino/RouletteManager";
import { ISubCommand } from "../../CommandManager";

import { CasinoRouletteSubCommandToken } from "./roulette";

@Service({ id: CasinoRouletteSubCommandToken, multiple: true })
export class CasinoRuletteBetCmd implements ISubCommand {
  readonly name: string = "bet";
  readonly description: string = "Bet in the current roulette game";

  @Inject()
  private readonly rouletteManager: RouletteManager;

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
            ["Único (Número qualquer)", RouletteBetType.SINGLE],
            ["Split (Números adjacentes)", RouletteBetType.SPLIT],
            ["Street (Coluna)", RouletteBetType.STREET],
            ["Corner (4 números adjacentes)", RouletteBetType.CORNER],
            ["Double Street (2 colunas adjacentes)", RouletteBetType.DSTREET],
            ["Trio (0,1,2 ou 0,2,3)", RouletteBetType.TRIO],
            ["First Four (0,1,2,3)", RouletteBetType.FFOUR],
            ["Metades (1-18, 19-25, Cores, Par, Ímpar)", RouletteBetType.HALF],
            ["Duzias", RouletteBetType.DOZEN],
            ["Linhas", RouletteBetType.COLUMN],
          ])
          .setRequired(true)
      );
  }

  async run(interaction: CommandInteraction): Promise<void> {
    const user = interaction.user;
    const amount = interaction.options.getInteger("amount", true);
    const type = interaction.options.getString("type", true) as RouletteBetType;

    if (!this.rouletteManager.hasRunningGame(interaction.guildId)) {
      await interaction.reply({
        content:
          "Não tem nenhuma rodada acontecendo nesser server!\nVocê pode começar uma com `/casino roulette start`",
        ephemeral: true,
      });
    }

    const options = _.chunk(RoulettePossibleBetFriendlyNameMap[type], 25).map((v, i) =>
      v.map((iv, ii) => ({ label: iv, value: (ii + 25 * i).toString() }))
    );

    await interaction.reply({
      embeds: [
        new MessageEmbed()
          .setDescription(
            stripIndents`Você pediu para apostar na roleta!
            Escolha o número em quer apostar abaixo.
            Não é possível retirar nem mudar a aposta até o sorteio.
            Você ainda poderá apostar mais vezes nessa mesma rodada!`
          )
          .addField("Tipo", type, true)
          .setFooter("Você tem 60 segundos para confirmar sua aposta."),
      ],
      components: [
        ...options.map((o, i) =>
          new MessageActionRow().addComponents(
            new MessageSelectMenu()
              .setCustomId(`roulette-bet:${interaction.user.id}:${i}:selection`)
              .setPlaceholder("Escolha a aposta aqui!")
              .addOptions(o)
          )
        ),
        new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId(`roulette-bet:${interaction.user.id}:cancel`)
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
      if (i.isSelectMenu()) {
        const roulette_bet = { value: amount, type, bet: parseInt(i.values[0]) };

        try {
          if (!(await this.rouletteManager.registerBet(interaction.guildId, user.id, roulette_bet))) {
            await interaction.editReply({
              content: "Erro ao registrar aposta :( Acho que já tem 10 pessoas participando dessa rodada.",
              embeds: [],
              components: [],
            });
          } else {
            await interaction.editReply({
              content: "Aposta registrada! Pode registrar uma nova aposta se quiser!",
              embeds: [],
              components: [],
            });
            await this.rouletteManager.announceBet(interaction.guildId);
          }
        } catch (err) {
          this.logger.error("error on bet registering", err);
        }
      } else {
        await interaction.editReply({
          content: "Aposta cancelada, pode fazer novamente com `/casino roulette bet`",
          embeds: [],
          components: [],
        });
      }

      collector.removeAllListeners("end");
    });

    collector.once("end", async () => {
      await interaction.editReply({
        content: "Aposta cancelada, pode fazer novamente com `/casino roulette bet`",
        embeds: [],
        components: [],
      });
    });
  }
}
