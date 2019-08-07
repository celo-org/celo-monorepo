import { addCeloEnvMiddleware, addCeloGethDirMiddleware, CeloGethDirEnvArgv } from 'src/lib/utils'
import * as yargs from 'yargs'

export const command = 'deploy <deployMethod> <deployPackage>'

export const describe = 'commands for deployment of various packages in the monorepo'

export type DeployArgv = CeloGethDirEnvArgv

export const builder = (argv: yargs.Argv) => {
  return addCeloGethDirMiddleware(addCeloEnvMiddleware(argv)).commandDir('deploy', {
    extensions: ['ts'],
  })
}
export const handler = () => {
  // empty
}
