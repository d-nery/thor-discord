import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Logger } from "tslog";
import { Inject, Service } from "typedi";
import { BalanceError, CasinoManager } from "../../../services/casino/CasinoManager";
import { emojis } from "../../../utils/entities";
import { ISubCommand } from "../../CommandManager";

import { CasinoWalletSubCommandToken } from "./wallet";

@Service({ id: CasinoWalletSubCommandToken, multiple: true })
export class CasinoWalletTransferCmd implements ISubCommand {
  readonly name: string = "transfer";
  readonly description: string = "Transfer TB to someone else";

  @Inject()
  private readonly casinoManager: CasinoManager;

  @Inject()
  private readonly logger: Logger;

  async create(): Promise<SlashCommandSubcommandBuilder> {
    return new SlashCommandSubcommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption((op) => op.setName("to").setDescription("To who you want to transfer").setRequired(true))
      .addIntegerOption((op) => op.setName("amount").setDescription("Amount to transfer").setRequired(true));
  }

  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();

    let new_balance: number;

    const target = interaction.options.getUser("to").id;
    const amount = interaction.options.getInteger("amount");

    if (amount < 0) {
      await interaction.editReply("Você precisa escolher um valor positivo para transferir!");
      return;
    }

    try {
      new_balance = await this.casinoManager.transferBalance(interaction.guildId, interaction.user.id, target, amount);
    } catch (err) {
      if (err instanceof BalanceError) {
        await interaction.editReply(`Você não tem ${emojis.TB} suficiente!`);
        return;
      }

      throw err;
    }

    await interaction.editReply(`Valor transferido com sucesso! Saldo atual: ${emojis.TB} ${new_balance}`);
  }
}
