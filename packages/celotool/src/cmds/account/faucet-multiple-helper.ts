// TODO: make this work with new contracts

import { CeloEnvArgv } from '@celo/celotool/src/lib/utils'

export const command = 'faucet-multiple-helper'

export const describe =
  'command for manual fauceting multiple accounts based on mnemonic provided in the .env file. Better use faucet-multiple.'

interface FaucetMultipleHelperArgv extends CeloEnvArgv {
  accounts: number
  goldValue: number
  stableValue: number
}

export const builder = (argv: CeloEnvArgv) => {
  return argv
    .option('accounts', {
      type: 'number',
      description: 'number of accounts to faucet based on mnemonic',
      demand: 'Please, specifiy the number of accounts',
    })
    .option('gold-value', {
      type: 'number',
      description: 'Amount of gold to faucet',
      default: 10,
    })
    .option('stable-value', {
      type: 'number',
      description: 'Amount of dollars to faucet',
      default: 100,
    })
}

export const handler = async (_argv: FaucetMultipleHelperArgv) => {
  // TODO: Fauceting multiple has been broken and should be reimplemented
  console.error('Functionality was not ported, and thus does not work')
}
