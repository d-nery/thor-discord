import { DocumentData, QueryDocumentSnapshot } from "@google-cloud/firestore";
import { BichoBet } from "./bicho";

export enum PlayerKey {
  TB = "tb",
  LAST_LOGIN = "last_login",
  BICHO = "bicho",
}

export class Player {
  constructor(readonly tb: number, readonly bet?: BichoBet) {}
}

export const playerConverter = {
  toFirestore(player: Player): DocumentData {
    return { ...player };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Player {
    const data = snapshot.data();
    return new Player(data.tb, data.bet);
  },
};
