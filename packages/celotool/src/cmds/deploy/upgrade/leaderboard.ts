import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { createClusterIfNotExists, switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart, removeHelmRelease, upgradeHelmChart } from 'src/lib/leaderboard'
import yargs from 'yargs'

export const command = 'leaderboard'

export const describe = 'upgrade the leaderboard package'

type LeaderboardArgv = UpgradeArgv & {
  reset: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('reset', {
    description: 'Destroy & redeploy the leaderboard package',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: LeaderboardArgv) => {
  await createClusterIfNotExists()
  await switchToClusterFromEnv()

  if (argv.reset === true) {
    await removeHelmRelease(argv.celoEnv)
    await installHelmChart(argv.celoEnv)
  } else {
    await upgradeHelmChart(argv.celoEnv)
  }
}
