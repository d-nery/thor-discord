import "reflect-metadata";

import Container from "typedi";

import { Bot } from "./bot";
import { DrawManager } from "./services/casino/DrawManager";
import startup from "./startup";

const start = async (): Promise<void> => {
  await startup();

  const bot = Container.get(Bot);

  await bot.setup();
  await bot.run();
};

start().catch(console.error);
