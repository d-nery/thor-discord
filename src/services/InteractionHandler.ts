import { Interaction } from "discord.js";
import { Logger } from "tslog";
import Container, { Inject, Service } from "typedi";
import { CasinoCmd } from "../commands/casino/casino";

import { CommandToken, ICommand } from "../commands/CommandManager";

@Service()
export class InteractionHandler {
  @Inject()
  private readonly logger: Logger;

  private readonly commands: ICommand[];

  constructor() {
    this.commands = Container.getMany(CommandToken).concat(Container.get(CasinoCmd));
  }

  async handle(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand()) {
      return Promise.reject("Won't run non-command interactions.");
    }

    this.logger.debug("Received command", { name: interaction.commandName, by: interaction.user.tag });

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

      if (interaction.deferred) {
        await interaction.editReply({ content: "Whoops! Algo deu errado :(" });
      }

      return;
    }

    this.logger.info("Command ran succesfully", { command: interaction.commandName });
  }
}
