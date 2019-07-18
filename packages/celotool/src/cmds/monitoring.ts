import { addCeloEnvMiddleware } from 'src/lib/utils'
import * as yargs from 'yargs'

export const command = 'monitoring <accountCommand>'

export const describe = 'commands for interacting with Stackdriver Monitoring'

export const builder = (argv: yargs.Argv) =>
  addCeloEnvMiddleware(argv).commandDir('monitoring', { extensions: ['ts'] })

export const handler = () => {
  // empty
}
