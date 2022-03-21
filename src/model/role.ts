import { DocumentData, QueryDocumentSnapshot } from "@google-cloud/firestore";

export class EmojiRole {
  constructor(readonly description: string, readonly eid: string, readonly rid: string) {}
}

export const roleConverter = {
  toFirestore(role: EmojiRole): DocumentData {
    return { ...role };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): EmojiRole {
    const data = snapshot.data();
    return new EmojiRole(data.description, data.eid, data.rid);
  },
};
