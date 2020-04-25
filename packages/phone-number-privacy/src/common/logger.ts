// tslint:disable: no-console
import { v4 as uuidv4 } from 'uuid'

// This allows us to differentiate parallel instantiations of this function
const prefix = uuidv4().slice(0, 8)

const logger = {
  debug: (...args: any[]) => console.debug(`${prefix}::`, ...args),
  info: (...args: any[]) => console.info(`${prefix}::`, ...args),
  warn: (...args: any[]) => console.warn(`${prefix}::`, ...args),
  error: (...args: any[]) => console.error(`${prefix}::`, ...args),
}

export default logger
