import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd } from 'src/lib/cmd-utils'
import { getBlockscoutUrl } from 'src/lib/endpoints'
import { portForwardAnd } from 'src/lib/port_forward'
import yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'

export const command = 'verify-contracts'

export const describe = 'verify the celo smart contracts in blockscout'

export const builder = (argv: yargs.Argv) => {
  return argv.option('contract', {
    type: 'string',
    description: 'Contract name if only one contract want to be verified',
    default: 'all',
  })
}

interface VerifyContractsInitialArgv extends InitialArgv {
  contract: string
}

export const handler = async (argv: VerifyContractsInitialArgv) => {
  await switchToClusterFromEnv()
  // Check if blockscout is deployed and online?
  const blockscoutUrl = getBlockscoutUrl(argv.celoEnv)

  console.debug(
    `Validating smart contracts ${argv.contract} in ${argv.celoEnv} for URL ${blockscoutUrl}`
  )

  const cb = async () => {
    await execCmd(
      `yarn --cwd ../protocol run verify -c ${argv.contract} -n ${argv.celoEnv} -b ${blockscoutUrl}`
    )
  }

  try {
    await portForwardAnd(argv.celoEnv, cb)
    process.exit(0)
  } catch (error) {
    console.error(`Unable to verify contracts from ${argv.celoEnv} in ${blockscoutUrl}`)
    console.error(error)
    process.exit(1)
  }
}
