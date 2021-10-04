import { Firestore } from "@google-cloud/firestore";
import { Inject, Service, Token } from "typedi";
import { Logger } from "tslog";

import { Config, configConverter, ConfigKey } from "../model/config";
import { IRepository } from "./services";

export const ConfigRepositoryToken = new Token<IRepository<ConfigKey, Config>>("db.config_repository");

@Service()
export class ConfigRepository implements IRepository<ConfigKey, Config> {
  private readonly key = "config";

  @Inject("db.firestore_client")
  private readonly client: Firestore;

  @Inject("logger")
  private readonly logger: Logger;

  async set(guildId: string, key: ConfigKey, value: Config): Promise<void> {
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

    return guildConfig.data();
  }
}
