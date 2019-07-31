import { UpgradeArgv } from '@celo/celotool/src/cmds/deploy/upgrade'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { resetAndUpgradeHelmChart, upgradeHelmChart, upgradeStaticIPs } from 'src/lib/helm_deploy'
import {
  uploadGenesisBlockToGoogleStorage,
  uploadStaticNodesToGoogleStorage,
} from 'src/lib/testnet-utils'

export const command = 'testnet'
export const describe = 'upgrade an existing deploy of the testnet package'

// Can't extend because yargs.Argv already has a `reset` property
type TestnetArgv = UpgradeArgv & {
  reset: boolean
}

export const builder = {}

export const handler = async (argv: TestnetArgv) => {
  await switchToClusterFromEnv()

  await upgradeStaticIPs(argv.celoEnv)

  if (argv.reset) {
    await resetAndUpgradeHelmChart(argv.celoEnv)
  } else {
    await upgradeHelmChart(argv.celoEnv)
  }
  await uploadGenesisBlockToGoogleStorage(argv.celoEnv)
  await uploadStaticNodesToGoogleStorage(argv.celoEnv)
}
