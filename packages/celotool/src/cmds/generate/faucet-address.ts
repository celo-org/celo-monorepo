import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import { AccountType, getAddressFromEnv } from 'src/lib/generate_utils'
import * as yargs from 'yargs'

export const command = 'faucet-address'

export const describe =
  'command for fetching the faucet address specified by the current environment'

type FaucetAddress = CeloEnvArgv

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
}

export const handler = async (_argv: FaucetAddress) => {
  const validator0Address = getAddressFromEnv(AccountType.VALIDATOR, 0)
  console.info(validator0Address)
}
