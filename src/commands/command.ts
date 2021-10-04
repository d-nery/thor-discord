import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Token } from "typedi";

export interface ICommand {
  name: string;
  description: string;
  create(): SlashCommandBuilder;
  permissions(owner_id: string): [{ id: string; type: string; permission: boolean }?];
  run(interaction: CommandInteraction): Promise<void>;
}

export const CommandToken = new Token<ICommand>("commands");
