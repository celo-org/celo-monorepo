import { addCeloEnvMiddleware } from 'src/lib/env-utils'
import yargs from 'yargs'

export const command = 'monitoring <accountCommand>'

export const describe = 'commands for interacting with Stackdriver Monitoring'

export const builder = (argv: yargs.Argv) =>
  addCeloEnvMiddleware(argv).commandDir('monitoring', { extensions: ['ts'] })

export const handler = () => {
  // empty
}
