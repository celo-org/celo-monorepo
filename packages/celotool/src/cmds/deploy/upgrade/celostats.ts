import { installHelmChart, removeHelmRelease, upgradeHelmChart } from 'src/lib/celostats'
import { createClusterIfNotExists, switchToClusterFromEnv } from 'src/lib/cluster'
import yargs from 'yargs'
import { UpgradeArgv } from '../upgrade'

export const command = 'celostats'

export const describe = 'upgrade the celostats package'

type CelostatsArgv = UpgradeArgv & {
  reset: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('reset', {
    description: 'Destroy & redeploy the celostats package',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: CelostatsArgv) => {
  await createClusterIfNotExists()
  await switchToClusterFromEnv()

  if (argv.reset === true) {
    await removeHelmRelease(argv.celoEnv)
    await installHelmChart(argv.celoEnv)
  } else {
    await upgradeHelmChart(argv.celoEnv)
  }
}
