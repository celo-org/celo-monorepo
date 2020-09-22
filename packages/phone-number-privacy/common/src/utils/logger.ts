// tslint:disable: no-console

const now = () => new Date().toISOString()

const logger = {
  debug: (...args: any[]) => console.debug(`${now()}::`, ...args),
  info: (...args: any[]) => console.info(`${now()}::`, ...args),
  warn: (...args: any[]) => console.warn(`${now()}::`, ...args),
  error: (...args: any[]) => console.error(`${now()}::`, ...args),
}

export default logger
