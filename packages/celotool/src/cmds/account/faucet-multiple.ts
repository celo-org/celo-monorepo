/* tslint:disable no-console */
import { CeloEnvArgv } from '@celo/celotool/src/lib/utils'
import { spawnSync } from 'child_process'
import path from 'path'

export const command = 'faucet-multiple'

export const describe = 'command for running geth'

interface FaucetMultipleArgv extends CeloEnvArgv {
  accounts: number
}

export const builder = (argv: CeloEnvArgv) => {
  return argv.option('accounts', {
    type: 'number',
    description: 'number of accounts to faucet based on mnemonic',
    demand: 'Please, specify the number of accounts',
  })
}

export const handler = async (argv: FaucetMultipleArgv) => {
  console.log(path.resolve(__dirname, 'scripts/faucet-multiple.sh'))
  await spawnSync(
    '/bin/bash',
    [path.resolve(__dirname, 'scripts/faucet-multiple.sh'), argv.celoEnv, `${argv.accounts}`],
    {
      stdio: 'inherit',
    }
  )
}
