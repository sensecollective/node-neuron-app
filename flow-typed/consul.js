declare module 'consul' {
  declare type ConsulOptions = {
    host?: string,
    port?: number,
    secure?: boolean,
    ca?: string[],
    defaults?: Object,
    promisify?: boolean | (Function => *),
  };

  declare interface Consul {
    constructor(options?: ConsulOptions): Consul;

    agent: {
      service: {
        register: (opts: Object) => Promise<void>,
        deregister: (opts: Object) => Promise<void>,
      },
    };
    kv: {
      set: (key: string, value: string | Buffer) => Promise<boolean>,
    };
  }

  declare module.exports: Class<Consul>;
}
