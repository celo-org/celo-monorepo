import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/utils'
import * as yargs from 'yargs'

export const command = 'deploy <deployMethod> <deployPackage>'

export const describe = 'commands for deployment of various packages in the monorepo'

export type DeployArgv = CeloEnvArgv

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv).commandDir('deploy', { extensions: ['ts'] })
}
export const handler = () => {
  // empty
}
