import { DocumentData, QueryDocumentSnapshot } from "@google-cloud/firestore";

export enum GuildKey {
  ROLE_ID = "role_id",
  CATEGORY_ID = "role_id",
}

export class GuildInfo {
  constructor(readonly role_id: string, readonly category_id: string, readonly lobby_channel_id: string) {}
}

export const guildInfoConverter = {
  toFirestore(guild: GuildInfo): DocumentData {
    return { ...guild };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): GuildInfo {
    const data = snapshot.data();
    return new GuildInfo(data.role_id, data.category_id, data.lobby_channel_id);
  },
};
