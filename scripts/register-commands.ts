import "reflect-metadata";

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import startup from "../src/startup";
import { CommandToken } from "../src/commands/CommandManager";
import Container from "typedi";

(async () => {
  console.log("Running command creation -", process.env.NODE_ENV);

  await startup();

  const { appId, guildId } = Container.get("app.config");
  console.log("GuildID -", guildId);

  const commands = Container.getMany(CommandToken);
  const commands_json = await Promise.all(
    Container.getMany(CommandToken).map(async (cmd) => (await cmd.create()).toJSON())
  );
  const rest = new REST({ version: "9" }).setToken(Container.get("discord.token"));

  try {
    const resp = (await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands_json })) as {
      id: string;
      name: string;
    }[];
    console.log("Succesfully registered application commands");
    console.log(commands.map((c) => c.name).join("\n"));

    const permissions = resp.map(({ id, name }) => {
      return {
        id: id,
        permissions: commands.find((c) => c.name == name).permissions("232163710506893312"),
      };
    });

    await rest.put(Routes.guildApplicationCommandsPermissions(appId, guildId), { body: permissions });
    console.log("Succesfully registered application permissions");
  } catch (err) {
    console.error(err);
  }
})();
