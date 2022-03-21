import "reflect-metadata";

import Container from "typedi";
import startup from "../src/startup";
import { CommandManager } from "../src/commands/CommandManager";

const register = async (): Promise<void> => {
  console.log("Running command creation -", process.env.NODE_ENV);

  await startup();

  const { guildId } = Container.get("app.config");
  const command_manager = Container.get(CommandManager);

  try {
    await command_manager.registerDefaultCommands(guildId);
  } catch (err) {
    console.error(err);
  }
};

register().catch(console.error);
