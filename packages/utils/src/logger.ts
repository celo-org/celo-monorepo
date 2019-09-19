export type Logger = (...args: any[]) => void

export const noopLogger: Logger = () => {
  /*noop*/
}

export const prefixLogger = (prefix: string, logger: Logger) => {
  if (logger === noopLogger) {
    return noopLogger
  } else {
    return (...args: any[]) => logger(`${prefix}:: `, ...args)
  }
}

export const consoleLogger: Logger = console.log
