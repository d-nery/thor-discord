import { Firestore } from "@google-cloud/firestore";
import { Inject, Service } from "typedi";
import { Logger } from "tslog";

import { Config, configConverter, ConfigKey } from "../model/config";

@Service()
export class ConfigRepository {
  private readonly key = "config";

  @Inject()
  private readonly client: Firestore;

  @Inject()
  private readonly logger: Logger;

  async set(guildId: string, key: ConfigKey, value: string): Promise<void> {
    if (!Object.values(ConfigKey).includes(key)) {
      this.logger.warn(`Tried to insert invalid key in config ${key}`);
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

  async replace(guildId: string, value: Config): Promise<void> {
    await this.client.collection(this.key).doc(guildId).withConverter(configConverter).set(value);
  }

  async get(guildId: string): Promise<Config> {
    const guildConfig = await this.client
      .collection(this.key)
      .doc(guildId ?? "default")
      .withConverter(configConverter)
      .get();

    if (!guildConfig.exists) {
      await this.client.collection(this.key).doc(guildId).create({});
      this.logger.info("Added guild to database", { collection: this.key, guildId: guildId });
      return null;
    }

    return guildConfig.data();
  }

  async list(): Promise<Array<string>> {
    const guildList = await this.client.collection(this.key).listDocuments();

    return guildList.map((d) => d.id);
  }
}
