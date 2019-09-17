import { createClusterIfNotExists, switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart, removeHelmRelease, upgradeHelmChart } from 'src/lib/ethstats'
import yargs from 'yargs'
import { UpgradeArgv } from '../../deploy/upgrade'

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
