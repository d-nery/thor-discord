import { DocumentData, QueryDocumentSnapshot, Timestamp } from "@google-cloud/firestore";
import { BichoBet } from "./bicho";

export enum PlayerKey {
  TB = "tb",
  DAILY = "daily",
  BICHO = "bicho",
}

export type Daily = {
  last: Timestamp;
  streak: number;
};

export class Player {
  constructor(readonly tb: number, readonly daily?: Daily, readonly bet?: BichoBet) {}
}

export const playerConverter = {
  toFirestore(player: Player): DocumentData {
    return { ...player };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Player {
    const data = snapshot.data();
    return new Player(data.tb, data.daily ?? { last: new Timestamp(0, 0), streak: 0 }, data.bet);
  },
};
