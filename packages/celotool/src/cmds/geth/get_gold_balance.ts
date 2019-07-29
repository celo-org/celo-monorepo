import { GethArgv } from '@celo/celotool/src/cmds/geth'
import {
  addCeloEnvMiddleware,
  addCeloGethMiddleware,
  ensure0x,
  execCmdWithExitOnFailure,
} from '@celo/celotool/src/lib/utils'
import * as yargs from 'yargs'

export const command = 'get gold balance'

export const describe = 'command for initializing geth'

interface GetGoldBalanceArgv extends GethArgv {
  account: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloGethMiddleware(addCeloEnvMiddleware(argv)).option('account', {
    type: 'string',
    description: 'Account to get balance for',
    default: null,
  })
}

const invalidArgumentExit = (argumentName?: string, errorMessage?: string) => {
  console.error(`Invalid argument ${argumentName}: ${errorMessage}`)
  process.exit(1)
}

export const handler = async (argv: GetGoldBalanceArgv) => {
  const gethBinary = `${argv.gethDir}/build/bin/geth`
  const datadir = argv.dataDir
  let account = argv.account

  if (account === null || account.length === 0) {
    invalidArgumentExit(account, 'Account must be provided')
    // This return is required to prevent false lint errors in the code following this line
    return
  }
  account = ensure0x(account)
  if (account.length !== 42) {
    invalidArgumentExit(account, 'Account must be 40 hex-chars')
  }

  const jsCmd = `eth.getBalance\('${account}'\)`
  const returnValues = await execGethJsCmd(gethBinary, datadir, jsCmd)
  console.info('Gold balance: ' + returnValues[0])
}

export const execGethJsCmd = (gethBinary: string, datadir: string, jsCmd: string) => {
  return execCmdWithExitOnFailure(`${gethBinary} -datadir "${datadir}" attach --exec "${jsCmd}"`)
}
