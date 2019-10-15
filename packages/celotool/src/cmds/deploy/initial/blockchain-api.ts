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
  console.info(`updating blockchain-api yaml file for env ${argv.celoEnv}`)
  await execCmd(
    `yarn --cwd ../blockchain-api new_address=$(celotooljs generate address-from-env --index 0 --accountType validator --celo-env ${
      argv.celoEnv
    }) | sed -i.bak 's/FAUCET_ADDRESS: .*$/FAUCET_ADDRESS: \"'"$new_address"'\"/g' app.${
      argv.celoEnv
    }.yaml `
  )
  console.info(`deploying blockchain-api for env ${argv.config} to ${testnetProjectName}`)
  await execCmd(
    `yarn --cwd ../blockchain-api run deploy -p ${testnetProjectName} -n ${argv.celoEnv}`
  )
  console.info(`blockchain-api deploy complete`)
}
