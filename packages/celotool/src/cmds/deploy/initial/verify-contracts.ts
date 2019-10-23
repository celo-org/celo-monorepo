import * as yargs from 'yargs'
import { CeloEnvArgv } from 'src/lib/env-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { getBlockscoutUrl } from 'src/lib/endpoints'
import { execCmd } from 'src/lib/utils'

interface ValidateArgv extends CeloEnvArgv {}

export const command = 'contracts'

export const describe = 'verify the celo smart contracts in blockscout'

export const builder = (argv: yargs.Argv) => {
  return argv.option('skipClusterSetup', {
    type: 'boolean',
    description: 'If you know that you can skip the cluster setup',
    default: false,
  })
}

export const handler = async (argv: ValidateArgv) => {
  await switchToClusterFromEnv()
  // Check if blockscout is deployed and online?
  const blockscoutUrl = getBlockscoutUrl(argv)

  console.log(`Validating smart contracts from ${argv.celoEnv} in ${blockscoutUrl}`)

  const cb = async () => {
    await execCmd(
      `yarn --cwd ../protocol run verify all --network ${
        argv.celoEnv
      } --blockscout-url ${blockscoutUrl}`
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
