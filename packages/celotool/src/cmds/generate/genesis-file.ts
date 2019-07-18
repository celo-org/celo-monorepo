import { addCeloEnvMiddleware, CeloEnvArgv } from '@celo/celotool/src/lib/utils'
import { generateGenesisFromEnv } from 'src/lib/generate_utils'
import * as yargs from 'yargs'

export const command = 'genesis-file'

export const describe = 'command for creating the genesis file by the current environment'

type GenesisFileArgv = CeloEnvArgv

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
}

export const handler = async (_argv: GenesisFileArgv) => {
  const genesisFile = generateGenesisFromEnv()
  console.info(genesisFile)
}
