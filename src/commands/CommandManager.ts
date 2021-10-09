import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { Client, CommandInteraction } from "discord.js";
import Container, { Inject, Service, Token } from "typedi";
import { RolesCmd } from "./admin/roles";
import { CasinoProfileCmd } from "./casino/profile";
import { CasinoRegisterCmd } from "./casino/register";
import { AvatarCmd } from "./misc/avatar";
import { InfoCmd } from "./misc/info";
import { RobotCmd } from "./misc/robot";

export type CommandPermission = { id: string; type: number; permission: boolean };

export interface ICommand {
  name: string;
  description: string;
  create(): Promise<SlashCommandBuilder>;
  permissions(owner_id: string): [CommandPermission?];
  run(interaction: CommandInteraction): Promise<void>;
}

export interface ISubCommand {
  name: string;
  description: string;
  create(): Promise<SlashCommandSubcommandBuilder>;
  run(interaction: CommandInteraction): Promise<void>;
}

export const CommandToken = new Token<ICommand>("commands");

// @Service()
// export class CommandManager {
//   @Inject()
//   private readonly client: Client;

//   injectCommands(): void {
//     Container.import([InfoCmd, RolesCmd, AvatarCmd, RobotCmd, CasinoRegisterCmd]);
//     Container.import([CasinoProfileCmd]);
//   }

//   async registerCommands(guildId: string): Promise<void> {
//     const commands = Container.getMany(CommandToken);
//     const commands_json = await Promise.all(commands.map(async (c) => (await c.create()).toJSON()));

//     // this.client.guilds.cache.get(guildId)?.commands.set(commands_json);
//   }
// }
