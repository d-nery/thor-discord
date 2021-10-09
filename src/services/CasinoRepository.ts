import { CollectionReference, DocumentData, DocumentReference, Firestore } from "@google-cloud/firestore";
import { Inject, Service } from "typedi";
import { Logger } from "tslog";
import { Player, playerConverter } from "../model/casino/player";
import { guildInfoConverter, GuildInfo } from "../model/casino/guild_info";

@Service({ transient: true })
export class CasinoRepository {
  private readonly key = "casino";
  private readonly players_key = "players";
  private _gid?: string;

  @Inject()
  private readonly client: Firestore;

  @Inject()
  private readonly logger: Logger;

  get guildId(): string {
    return this._gid;
  }

  set guildId(guildId: string) {
    this._gid = guildId;
  }

  private get base_collection() {
    return this.client.collection(this.key);
  }

  get guild_doc(): DocumentReference<DocumentData> {
    if (this._gid == null) {
      throw "guildId can't be null, please set guildId before using other methods";
    }

    return this.base_collection.doc(this.guildId);
  }

  get player_collection(): CollectionReference<DocumentData> {
    return this.guild_doc.collection(this.players_key);
  }

  async guildRegistered(): Promise<boolean> {
    const guildData = await this.guild_doc.get();
    return guildData.exists;
  }

  async registerGuild(guildInfo: GuildInfo): Promise<void> {
    if (await this.guildRegistered()) {
      throw "Guild already registered!";
    }

    await this.guild_doc.withConverter(guildInfoConverter).create(guildInfo);
    this.logger.info("Added guild to database", { collection: this.key, guildId: this.guildId, info: guildInfo });
  }

  async playerRegistered(playerId: string): Promise<boolean> {
    const playerData = await this.player_collection.doc(playerId).withConverter(playerConverter).get();

    return !playerData.exists;
  }

  async registerPlayer(playerId: string): Promise<void> {
    if (await this.playerRegistered(playerId)) {
      throw "Player already registered!";
    }

    await this.player_collection.doc(playerId).withConverter(playerConverter).create(new Player(0));
    this.logger.info("Added player to database", { collection: this.key, guildId: this.guildId, playerId: playerId });
  }

  async getPlayerInfo(playerId: string): Promise<Player> {
    if (!(await this.playerRegistered(playerId))) {
      throw "Player not registered!";
    }

    const playerData = await this.player_collection.doc(playerId).withConverter(playerConverter).get();
    return playerData.data();
  }
}
