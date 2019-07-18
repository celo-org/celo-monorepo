import { UpgradeArgv } from '@celo/celotool/src/cmds/deploy/upgrade'
import sleep from 'sleep-promise'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import {
  deletePersistentVolumeClaims,
  installHelmChart,
  removeHelmRelease,
  upgradeHelmChart,
} from 'src/lib/helm_deploy'
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

  if (argv.reset) {
    await removeHelmRelease(argv.celoEnv)
    await deletePersistentVolumeClaims(argv.celoEnv)
    await sleep(5000)
    await installHelmChart(argv.celoEnv)
  } else {
    await upgradeHelmChart(argv.celoEnv)
  }
  await uploadGenesisBlockToGoogleStorage(argv.celoEnv)
  await uploadStaticNodesToGoogleStorage(argv.celoEnv)
}
