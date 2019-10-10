import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import { getValidator0AddressFromEnv } from 'src/lib/generate_utils'
import * as yargs from 'yargs'

export const command = 'faucet-address'

export const describe =
  'command for fetching the faucet address specified by the current environment'

type GenesisFileArgv = CeloEnvArgv

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
}

export const handler = async (_argv: GenesisFileArgv) => {
  const validator0Address = getValidator0AddressFromEnv()
  console.info(validator0Address)
}
