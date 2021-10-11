import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember, User } from "discord.js";
import Container, { Service } from "typedi";
import { CasinoRepository } from "../../services/CasinoRepository";
import { ISubCommand } from "../CommandManager";
import { CasinoSubCommandToken } from "./casino";

@Service({ id: CasinoSubCommandToken, multiple: true })
export class CasinoProfileCmd implements ISubCommand {
  readonly name: string = "profile";
  readonly description: string = "Get a user's casino profile";

  async create(): Promise<SlashCommandSubcommandBuilder> {
    return new SlashCommandSubcommandBuilder()
      .addUserOption((op) => {
        return op.setName("who").setDescription("Whose profile you want to see (default: you)");
      })
      .setName(this.name)
      .setDescription(this.description);
  }

  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    const target = (interaction.options.getMember("who", false) ?? interaction.user) as User | GuildMember;

    const repository = Container.get(CasinoRepository);
    repository.guildId = interaction.guildId;

    const playerInfo = await repository.getPlayerInfo(target.id);

    await interaction.editReply(`TB: ${playerInfo.tb}`);
  }
}
