import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { CommandInteraction } from "discord.js";
import Container, { Inject, InjectMany, Service, Token } from "typedi";
import { Logger } from "tslog";

import { CasinoCmd } from "./casino/casino";

export type CommandPermission = { id: string; type: number; permission: boolean };

export interface ICommand {
  name: string;
  description: string;
  create(): Promise<SlashCommandBuilder>;
  permissions(owner_id: string): [CommandPermission?];
  run(interaction: CommandInteraction): Promise<void>;
}

export interface ISubCommandGroup {
  name: string;
  description: string;
  create(): Promise<SlashCommandSubcommandGroupBuilder>;
  run(interaction: CommandInteraction): Promise<void>;
}

export interface ISubCommand {
  name: string;
  description: string;
  create(): Promise<SlashCommandSubcommandBuilder>;
  run(interaction: CommandInteraction): Promise<void>;
}

export const CommandToken = new Token<ICommand>("commands");

@Service()
export class CommandManager {
  @Inject()
  private readonly logger: Logger;

  @InjectMany(CommandToken)
  private readonly commands: ICommand[];

  async registerDefaultCommands(guildId: string): Promise<void> {
    const commands_json = await Promise.all(this.commands.map(async (c) => (await c.create()).toJSON()));
    const rest = new REST({ version: "9" }).setToken(Container.get("discord.token"));
    const { appId } = Container.get("app.config");

    const resp = (await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands_json })) as {
      id: string;
      name: string;
    }[];

    this.logger.info(
      "Succesfully registered application commands",
      resp.map((c) => {
        return { id: c.id, name: c.name };
      })
    );

    const permissions = resp.map(({ id, name }) => {
      return {
        id: id,
        permissions: this.commands.find((c) => c.name == name).permissions("232163710506893312"),
      };
    });

    await rest.put(Routes.guildApplicationCommandsPermissions(appId, guildId), { body: permissions });
    this.logger.info("Successfully registered application permissions");
  }

  async registerCasinoCommands(guildId: string, casinoRoleId: string): Promise<void> {
    const casino_command = Container.get(CasinoCmd);
    const casino_command_json = (await casino_command.create()).toJSON();
    const rest = new REST({ version: "9" }).setToken(Container.get("discord.token"));
    const { appId } = Container.get("app.config");

    const resp = (await rest.post(Routes.applicationGuildCommands(appId, guildId), {
      body: casino_command_json,
    })) as {
      id: string;
      name: string;
    };

    this.logger.info("Succesfully registered application commands", { id: resp.id, name: resp.name });

    await rest.put(Routes.applicationCommandPermissions(appId, guildId, resp.id), {
      body: { permissions: casino_command.permissions(casinoRoleId) },
    });
    this.logger.info("Succesfully registered application permissions");
  }
}
