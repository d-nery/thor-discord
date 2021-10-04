import { DocumentData, QueryDocumentSnapshot } from "@google-cloud/firestore";

import { EmojiRole } from "./role";

export enum ConfigKey {
  ROLES = "roles",
  ROLES_MID = "emoji_role_mid",
  ROLES_CID = "emoji_role_cid",
}

export class Config {
  constructor(readonly roles?: Array<EmojiRole>, readonly emoji_role_cid?: string, readonly emoji_role_mid?: string) {}
}

export const configConverter = {
  toFirestore(config: Config): DocumentData {
    return { ...config };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Config {
    const data = snapshot.data();
    return new Config(data.roles, data.emoji_role_cid, data.emoji_role_mid);
  },
};
