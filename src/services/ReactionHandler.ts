import {  MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import { Logger } from "tslog";
import { Inject, Service, Token } from "typedi";
import { Config, ConfigKey } from "../model/config";
import { ConfigRepositoryToken } from "./ConfigRepository";

import { IHandler, IRepository } from "./services";

export type ReactionEvent = {
  reaction: MessageReaction | PartialMessageReaction;
  user: User | PartialUser;
  removed?: boolean;
};

export const ReactionHandlerToken = new Token<IHandler<ReactionEvent>>("services.reaction_handler");

@Service()
export class ReactionHandler implements IHandler<ReactionEvent> {
  @Inject("logger")
  private readonly logger: Logger;

  @Inject(ConfigRepositoryToken)
  private readonly configRepository: IRepository<ConfigKey, Config>;

  async handle({ reaction, user, removed = false }: ReactionEvent): Promise<void> {
    if (user.bot) {
      return;
    }

    if (reaction.partial) {
      await reaction.fetch();
    }

    if (user.partial) {
      await user.fetch();
    }

    const guild_id = reaction.message.guildId;
    const message_id = reaction.message.id;
    const guild_config = await this.configRepository.get(guild_id);
    const mid = guild_config.emoji_role_mid;

    this.logger.debug(`Reaction received on message ${message_id}`);

    if (message_id !== mid) {
      return;
    }

    const emoji_roles = guild_config.roles;
    if (!emoji_roles.map((er) => er.eid).includes(reaction.emoji.id)) {
      removed || (await reaction.remove());
      return;
    }

    this.logger.info(`Role reaction ${removed ? "removed" : "added"} by ${user.tag}`);
    const guild_member = (await reaction.message.guild.members.fetch()).get(user.id);

    if (removed) {
      await guild_member.roles.remove(emoji_roles.find((er) => er.eid == reaction.emoji.id).rid);
    } else {
      await guild_member.roles.add(emoji_roles.find((er) => er.eid == reaction.emoji.id).rid);
    }
  }
}
