import { DocumentData, QueryDocumentSnapshot } from "@google-cloud/firestore";

export enum RobotKey {
  ACCENT = "accent",
  CATEGORY = "category",
  DEBUT = "debut",
  IS_ACTIVE = "is_active",
  LOGO = "logo",
  NAME = "name",
  TROPHIES = "trophies",
  TYPOGRAPHY = "typography",
  url = "url",
}

export class Robot {
  constructor(
    readonly accent: number,
    readonly category: string,
    readonly debut: number,
    readonly is_active: boolean,
    readonly logo: string,
    readonly name: string,
    readonly picture: string,
    readonly trophies: number[],
    readonly typography: string,
    readonly url: string
  ) {}
}

export const robotConverter = {
  toFirestore(robot: Robot): DocumentData {
    return { ...robot };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Robot {
    const data = snapshot.data();
    return new Robot(
      data.accent,
      data.category,
      data.debut,
      data.is_active,
      data.logo,
      data.name,
      data.picture,
      data.trophies,
      data.typography,
      data.url
    );
  },
};
