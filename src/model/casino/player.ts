import { DocumentData, QueryDocumentSnapshot } from "@google-cloud/firestore";

export enum PlayerKey {
  TB = "tb",
}

export class Player {
  constructor(readonly tb: number) {}
}

export const playerConverter = {
  toFirestore(player: Player): DocumentData {
    return { ...player };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Player {
    const data = snapshot.data();
    return new Player(data.tb);
  },
};
