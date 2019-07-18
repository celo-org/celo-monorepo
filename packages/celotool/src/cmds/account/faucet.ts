import { AccountArgv } from '@celo/celotool/src/cmds/account'
import { downloadArtifacts } from '@celo/celotool/src/lib/artifacts'
import { portForwardAnd } from '@celo/celotool/src/lib/port_forward'
import { execCmd, validateAccountAddress } from '@celo/celotool/src/lib/utils'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import * as yargs from 'yargs'

export const command = 'faucet'

export const describe = 'command for fauceting an address with gold and dollars'

interface FaucetArgv extends AccountArgv {
  account: string
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('account', {
    type: 'string',
    description: 'Account to faucet',
    demand: 'Please specify account to faucet',
    coerce: (address) => {
      if (!validateAccountAddress(address)) {
        throw Error(`Receiver Address is invalid: "${address}"`)
      }
      return address
    },
  })
}

export const handler = async (argv: FaucetArgv) => {
  await switchToClusterFromEnv()

  const cb = async () => {
    await execCmd(
      // TODO(yerdua): reimplement the protocol transfer script here, using
      //  the SDK + Web3 when the SDK can be built for multiple environments
      `yarn --cwd ../protocol run transfer -n ${argv.celoEnv} -a ${argv.account} -d 10 -g 10`
    )
  }

  try {
    await downloadArtifacts(argv.celoEnv)
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to faucet ${argv.account} on ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
