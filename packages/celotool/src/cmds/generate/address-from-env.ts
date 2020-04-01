/* tslint:disable no-console */
import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import {
  coerceMnemonicAccountType,
  getAddressFromEnv,
  MNEMONIC_ACCOUNT_TYPE_CHOICES,
} from 'src/lib/generate_utils'
import yargs from 'yargs'

export const command = 'address-from-env'

export const describe =
  'command for fetching addresses (validator, load_testing, tx_node, bootnode and faucet) as specified by the current environment'

interface AccountAddressArgv extends CeloEnvArgv {
  index: number
  accountType: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(
    argv
      .option('index', {
        alias: 'i',
        type: 'number',
        description: 'account index',
        demand: 'Please specifiy account index',
      })
      .option('accountType', {
        alias: 'a',
        type: 'string',
        choices: MNEMONIC_ACCOUNT_TYPE_CHOICES,
        description: 'account type',
        demand: 'Please specifiy account type',
        required: true,
      })
  )
}

export const handler = async (argv: CeloEnvArgv & AccountAddressArgv) => {
  const validatorAddress = getAddressFromEnv(
    coerceMnemonicAccountType(argv.accountType),
    argv.index
  )
  console.info(validatorAddress)
}
