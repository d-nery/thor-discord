/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { appId, guildId, token } = require("../config.json");
const { InfoCmd } = require("../dist/src/commands/impl/info");
const { RolesCmd } = require("../dist/src/commands/impl/roles");
const { AvatarCmd } = require("../dist/src/commands/impl/avatar");

const commands = [new InfoCmd(), new RolesCmd(), new AvatarCmd()].map((cmd) => cmd.create().toJSON());

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(appId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
