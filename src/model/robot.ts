import { DocumentData, QueryDocumentSnapshot } from "@google-cloud/firestore";

export enum RobotKey {
  ACCENT = "accent",
  CATEGORY = "category",
  DEBUT = "debut",
  LOGO = "logo",
  NAME = "name",
  RETIREMENT = "retirement",
  TROPHIES = "trophies",
  TYPOGRAPHY = "typography",
  URL = "url",
  WIKI = "wiki",
}

export class Robot {
  constructor(
    readonly accent: number,
    readonly category: string,
    readonly debut: number,
    readonly logo: string,
    readonly name: string,
    readonly picture: string,
    readonly trophies: number[],
    readonly typography: string,
    readonly url: string,
    readonly wiki?: string,
    readonly retirement?: string
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
      data.logo,
      data.name,
      data.picture,
      data.trophies,
      data.typography,
      data.url,
      data.wiki,
      data.retirement
    );
  },
};
