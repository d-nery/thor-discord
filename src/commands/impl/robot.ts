import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Inject, Service } from "typedi";

import { CommandToken, ICommand } from "../command";
import { RobotRepository } from "../../services/RobotRepository";
import { buildRobotEmbed } from "../../utils/embeds";

@Service({ id: CommandToken, multiple: true })
export class RobotCmd implements ICommand {
  @Inject()
  private readonly robotRepository: RobotRepository;

  readonly name: string = "robot";
  readonly description: string = "Info about a team robot";

  create(): SlashCommandBuilder {
    return new SlashCommandBuilder()
      .addStringOption((op) => {
        return op
          .setName("robot")
          .setDescription("Which robot to fetch")
          .addChoices([["Apolkalipse", "apolka"]])
          .setRequired(true);
      })
      .setName(this.name)
      .setDescription(this.description);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  permissions(_owner_id: string): [{ id: string; type: string; permission: boolean }?] {
    return [];
  }

  async run(interaction: CommandInteraction): Promise<void> {
    const robot_id = interaction.options.getString("robot");
    const robot = await this.robotRepository.get(robot_id);

    await interaction.reply({ embeds: [buildRobotEmbed(robot, interaction.client.application.iconURL())] });
  }
}
