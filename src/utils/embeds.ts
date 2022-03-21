import { MessageEmbed } from "discord.js";
import { Robot } from "../model/robot";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _whitespace = "\u2800";

export const buildRobotEmbed = (robot: Robot, footer_img?: string): MessageEmbed => {
  const [g, s, b] = robot.trophies.map((t) => t.toString());

  const links = `[Site](${robot.url})` + (robot.wiki ? `| [Wiki](${robot.url})` : "");
  const activity = `${robot.debut} - ` + (robot.retirement ? `${robot.retirement}` : "Atual");

  return new MessageEmbed()
    .setTitle(robot.name)
    .setThumbnail(robot.logo)
    .setImage(robot.typography)
    .addField("Categoria", robot.category, true)
    .addField("Atividade", activity, true)
    .addField("Links", links, true)
    .addField("Conquistas", `🥇: ${g} | 🥈: ${s} | 🥉: ${b}`, true)
    .setColor(robot.accent)
    .setFooter("Thor, the Rat | ThundeRatz", footer_img)
    .setTimestamp(new Date());
};
