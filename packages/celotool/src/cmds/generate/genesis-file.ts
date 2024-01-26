import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import { generateGenesisFromEnv } from 'src/lib/generate_utils'
import yargs from 'yargs'

export const command = 'genesis-file'

export const describe = 'command for creating the genesis file by the current environment'

type GenesisFileArgv = CeloEnvArgv

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
}

export const handler = (_argv: GenesisFileArgv) => {
  const genesisFile = generateGenesisFromEnv()
  console.info(genesisFile)
}
