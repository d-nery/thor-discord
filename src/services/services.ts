export interface IHandler<T> {
  handle(event: T): Promise<void>;
}

export interface IRepository<K, T> {
  set(guildId: string, key: K, value: T): Promise<void>;
  replace(guildId: string, value: T): Promise<void>;
  get(guildId: string): Promise<T>;
}
