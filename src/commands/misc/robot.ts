import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Inject, Service } from "typedi";

import { CommandPermission, CommandToken, ICommand } from "../CommandManager";
import { RobotRepository } from "../../services";
import { buildRobotEmbed } from "../../utils/embeds";

@Service({ id: CommandToken, multiple: true })
export class RobotCmd implements ICommand {
  @Inject()
  private readonly robotRepository: RobotRepository;

  readonly name: string = "robot";
  readonly description: string = "Info about a team robot";

  async create(): Promise<SlashCommandBuilder> {
    const choices = (await this.robotRepository.list()).map((k) => [k, k]) as [name: string, value: string][];

    return new SlashCommandBuilder()
      .addStringOption((op) => {
        return op.setName("robot").setDescription("Which robot to fetch").addChoices(choices).setRequired(true);
      })
      .setName(this.name)
      .setDescription(this.description);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  permissions(_owner_id: string): [CommandPermission?] {
    return [];
  }

  async run(interaction: CommandInteraction): Promise<void> {
    const robot_id = interaction.options.getString("robot");
    const robot = await this.robotRepository.get(robot_id);

    await interaction.reply({ embeds: [buildRobotEmbed(robot, interaction.client.application.iconURL())] });
  }
}
