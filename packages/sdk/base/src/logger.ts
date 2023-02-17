export type Logger = (...args: any[]) => void
/** @internal */
export const noopLogger: Logger = () => {
  /*noop*/
}
/** @internal */
export const prefixLogger = (prefix: string, logger: Logger) => {
  if (logger === noopLogger) {
    return noopLogger
  } else {
    return (...args: any[]) => logger(`${prefix}:: `, ...args)
  }
}
/** @internal */
export const consoleLogger: Logger = console.log
