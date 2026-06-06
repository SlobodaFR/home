export interface LoggerPort {
  debug(msg: string, data?: object): void;
  info(msg: string, data?: object): void;
  warn(msg: string, data?: object): void;
  error(msg: string, err?: Error, data?: object): void;
  child(bindings: Record<string, unknown>): LoggerPort;
}
