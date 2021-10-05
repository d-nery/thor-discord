import { MessageEmbed } from "discord.js";
import { Robot } from "../model/robot";

export const buildRobotEmbed = (robot: Robot, footer_img?: string): MessageEmbed => {
  return new MessageEmbed()
    .setTitle(robot.name)
    .setThumbnail(robot.logo)
    .setImage(robot.typography)
    .addField("Categoria", robot.category)
    .addField("Estreia", robot.debut.toString())
    .addField("🥇 Ouros", robot.trophies[0].toString(), true)
    .addField("🥈 Pratas", robot.trophies[1].toString(), true)
    .addField("🥉 Bronzes", robot.trophies[2].toString(), true)
    .setURL(robot.url)
    .setColor(robot.accent)
    .setFooter("Thor, the Rat | ThundeRatz", footer_img)
    .setTimestamp(new Date());
};
