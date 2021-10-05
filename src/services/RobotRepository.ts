import { Firestore } from "@google-cloud/firestore";
import { Inject, Service } from "typedi";
import { Logger } from "tslog";

import { Robot, robotConverter, RobotKey } from "../model/robot";

@Service()
export class RobotRepository {
  private readonly key = "bots";

  @Inject()
  private readonly client: Firestore;

  @Inject()
  private readonly logger: Logger;

  async set(guildId: string, key: RobotKey, value: Robot): Promise<void> {
    if (!Object.values(RobotKey).includes(key)) {
      this.logger.warn(`Tried to insert invalid key in Robot ${key}`);
      return;
    }

    await this.client
      .collection(this.key)
      .doc(guildId)
      .set(
        {
          [key]: value[key],
        },
        { merge: true }
      );
  }

  async replace(guildId: string, value: Robot): Promise<void> {
    await this.client.collection(this.key).doc(guildId).withConverter(robotConverter).set(value);
  }

  async get(robotId: string): Promise<Robot> {
    const robot = await this.client.collection(this.key).doc(robotId).withConverter(robotConverter).get();

    return robot.data();
  }

  async list(): Promise<Array<string>> {
    const robotList = await this.client.collection(this.key).listDocuments();

    return robotList.map((d) => d.id);
  }
}
