import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd } from 'src/lib/cmd-utils'
import { AccountType, getAddressFromEnv } from 'src/lib/generate_utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'blockchain-api'

export const describe = 'command for upgrading blockchain-api'

// Can't extend because yargs.Argv already has a `config` property
type BlockchainApiArgv = UpgradeArgv

export const handler = async (argv: BlockchainApiArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv(argv.celoEnv)
  const newFaucetAddress = getAddressFromEnv(AccountType.VALIDATOR, 0) // We use the 0th validator as the faucet
  console.info(`updating blockchain-api yaml file for env ${argv.celoEnv}`)
  await execCmd(
    // eslint-disable-next-line no-useless-escape
    `sed -i.bak 's/FAUCET_ADDRESS: .*$/FAUCET_ADDRESS: \"${newFaucetAddress}\"/g' ../blockchain-api/app.${argv.celoEnv}.yaml`
  )
  await execCmd(`rm ../blockchain-api/app.${argv.celoEnv}.yaml.bak`) // Removing temporary bak file

  // eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/restrict-template-expressions
  console.info(`deploying blockchain-api for env ${argv.config}`)
  await execCmd(`yarn --cwd ../blockchain-api run deploy -n ${argv.celoEnv}`)
  console.info(`blockchain-api deploy complete`)
}
