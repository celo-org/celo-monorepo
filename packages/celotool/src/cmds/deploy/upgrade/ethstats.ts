import { UpgradeArgv } from '@celo/celotool/src/cmds/deploy/upgrade'
import { createClusterIfNotExists, switchToClusterFromEnv } from '@celo/celotool/src/lib/cluster'
import {
  installHelmChart,
  removeHelmRelease,
  upgradeHelmChart,
} from '@celo/celotool/src/lib/ethstats'
import yargs from 'yargs'

export const command = 'ethstats'

export const describe = 'upgrade the ethstats package'

type EthstatsArgv = UpgradeArgv & {
  reset: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('reset', {
    description: 'Destroy & redeploy the ethstats package',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: EthstatsArgv) => {
  await createClusterIfNotExists()
  await switchToClusterFromEnv()

  if (argv.reset) {
    await removeHelmRelease(argv.celoEnv)
    await installHelmChart(argv.celoEnv)
  } else {
    await upgradeHelmChart(argv.celoEnv)
  }
}
