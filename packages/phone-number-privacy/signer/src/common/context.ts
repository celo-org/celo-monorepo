import Logger from 'bunyan'

export interface Context {
  logger: Logger
  url: string
  errors: string[]
}
