import * as yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { getBlockscoutUrl } from 'src/lib/endpoints'
import { execCmd } from 'src/lib/utils'

export const command = 'verify-contracts'

export const describe = 'verify the celo smart contracts in blockscout'

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('skipClusterSetup', {
      type: 'boolean',
      description: 'If you know that you can skip the cluster setup',
      default: false,
    })
    .option('contract', {
      type: 'string',
      description: 'Contract name if only one contract want to be verified',
      default: 'all',
    })
}

interface VerifyContractsInitialArgv extends InitialArgv {
  skipClusterSetup: boolean
  contract: string
}

export const handler = async (argv: VerifyContractsInitialArgv) => {
  await switchToClusterFromEnv()
  // Check if blockscout is deployed and online?
  const blockscoutUrl = getBlockscoutUrl(argv)

  console.log(`Validating smart contracts from ${argv.celoEnv} in ${blockscoutUrl}`)

  try {
    await execCmd(
      `yarn --cwd ../protocol run verify -n ${argv.celoEnv} -b ${blockscoutUrl} -c ${argv.contract}`
    )
    process.exit(0)
  } catch (error) {
    console.error(`Unable to verify contracts from ${argv.celoEnv} in ${blockscoutUrl}`)
    console.error(error)
    process.exit(1)
  }
}
