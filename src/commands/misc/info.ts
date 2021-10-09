import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import Container, { Service } from "typedi";

import "../../extensions/number";
import { CommandPermission, CommandToken, ICommand } from "../CommandManager";

@Service({ id: CommandToken, multiple: true })
export class InfoCmd implements ICommand {
  readonly name: string = "info";
  readonly description: string = "Info about the bot";

  async create(): Promise<SlashCommandBuilder> {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  permissions(_owner_id: string): [CommandPermission?] {
    return [];
  }

  async run(interaction: CommandInteraction): Promise<void> {
    const ws_latency = interaction.client.ws.ping;
    const now = process.hrtime();

    await interaction.reply("Fetching...");

    const rest_latency = Math.floor(process.hrtime(now)[1] / 1000000);
    const uptime = interaction.client.uptime.toTime();

    await interaction.editReply({
      content: null,
      embeds: [
        new MessageEmbed()
          .setColor(0xe800ff)
          .setTitle("Thor, the Rat")
          .addField("Latency", `${ws_latency}/${rest_latency}ms`, true)
          .addField("Uptime", `${uptime}`, true)
          .addField("Version", Container.get("app.version"), true)
          .toJSON(),
      ],
    });
  }
}
