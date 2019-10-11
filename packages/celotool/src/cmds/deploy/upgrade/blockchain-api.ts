import { switchToClusterFromEnv } from 'src/lib/cluster'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { execCmd } from 'src/lib/utils'
import { UpgradeArgv } from '../../deploy/upgrade'
export const command = 'blockchain-api'

export const describe = 'command for upgrading blockchain-api'

// Can't extend because yargs.Argv already has a `config` property
type BlockchainApiArgv = UpgradeArgv

export const handler = async (argv: BlockchainApiArgv) => {
  await switchToClusterFromEnv()
  const testnetProjectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  console.info(`deploying blockchain-api for env ${argv.config} to ${testnetProjectName}`)
  await execCmd(
    `yarn --cwd ../blockchain-api run deploy -p ${testnetProjectName} -n ${argv.celoEnv}`
  )
  console.info(`blockchain-api deploy complete`)
}
