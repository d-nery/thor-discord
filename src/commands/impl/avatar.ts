import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember, User } from "discord.js";
import { Service } from "typedi";
import { CommandToken, ICommand } from "../command";

@Service({ id: CommandToken, multiple: true })
export class AvatarCmd implements ICommand {
  readonly name: string = "avatar";
  readonly description: string = "Get a user's avatar";

  create(): SlashCommandBuilder {
    return new SlashCommandBuilder()
      .addUserOption((op) => {
        return op.setName("who").setDescription("Whose avatar you want to see");
      })
      .setName(this.name)
      .setDescription(this.description);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  permissions(_owner_id: string): [{ id: string; type: string; permission: boolean }?] {
    return [];
  }

  async run(interaction: CommandInteraction): Promise<void> {
    const target = interaction.options.getMember("who", false) ?? interaction.user;

    if (target instanceof GuildMember) {
      await interaction.reply(target.user.displayAvatarURL());
      return;
    }

    if (target instanceof User) {
      await interaction.reply(target.displayAvatarURL());
      return;
    }

    throw "target user is not GuildMember nor User";
  }
}
