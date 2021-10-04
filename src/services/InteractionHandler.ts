import { Interaction } from "discord.js";
import { Logger } from "tslog";
import Container, { Inject, Service, Token } from "typedi";

import { CommandToken, ICommand } from "../commands/command";
import { IHandler } from "./services";

export const InteractionHandlerToken = new Token<IHandler<Interaction>>("services.interaction_handler");

@Service()
export class InteractionHandler implements IHandler<Interaction> {
  @Inject("logger")
  private readonly logger: Logger;

  private readonly commands: ICommand[];

  constructor() {
    this.commands = Container.getMany(CommandToken);
  }

  async handle(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand()) {
      return Promise.reject();
    }

    this.logger.info(`Received command ${interaction.commandName} by ${interaction.user.tag}`);

    const command = this.commands.find((cmd) => cmd.name === interaction.commandName);

    if (!command) {
      this.logger.error(`Couldn't find command ${interaction.commandName}`);
      return;
    }

    try {
      await command.run(interaction);
    } catch (err) {
      this.logger.error(`Failed to run command ${command.name}: ${err}`);
      if (!interaction.replied) {
        await interaction.reply({ content: "Whoops! Algo deu errado :(", ephemeral: true });
      }

      return;
    }

    this.logger.debug(`Command ${interaction.commandName} ran succesfully`);
  }
}
