import "reflect-metadata";

import Container from "typedi";

import { Bot } from "./bot";
import startup from "./startup";

const start = async (): Promise<void> => {
  await startup();

  const bot = Container.get(Bot);
  await bot.setup();
  await bot.run();
};

try {
  start();
} catch (err) {
  console.error(err);
}
