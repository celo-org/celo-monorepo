import { InitialArgv } from 'src/cmds/deploy/initial'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart } from 'src/lib/leaderboard'
import yargs from 'yargs'

export const command = 'leaderboard'

export const describe = 'deploy the leaderboard for the specified network'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()
  await installHelmChart(argv.celoEnv)
}
