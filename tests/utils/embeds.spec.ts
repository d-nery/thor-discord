import "mocha";

import { expect } from "chai";
import { buildRobotEmbed } from "../../src/utils/embeds";
import { Robot } from "../../src/model/robot";
import { MessageEmbed } from "discord.js";

describe("embed utils", () => {
  it("should return correctly formatted embed", () => {
    const expected = new MessageEmbed()
      .setTitle("name")
      .setThumbnail("logo_url")
      .setImage("typo_url")
      .addField("Categoria", "category")
      .addField("Estreia", "9999")
      .addField("🥇 Ouros", "1", true)
      .addField("🥈 Pratas", "2", true)
      .addField("🥉 Bronzes", "0", true)
      .setURL("site_url")
      .setColor(0xffffff)
      .setFooter("Thor, the Rat | ThundeRatz", "footer_img_url")
      .setTimestamp(new Date());

    const got = buildRobotEmbed(
      new Robot(0xffffff, "category", 9999, false, "logo_url", "name", "...", [1, 2, 0], "typo_url", "site_url"),
      "footer_img_url"
    );

    expect(got).to.deep.eq(expected);
  });
});
