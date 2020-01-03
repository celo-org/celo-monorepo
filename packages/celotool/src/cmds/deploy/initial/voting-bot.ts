import { InitialArgv } from 'src/cmds/deploy/initial'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart, setupVotingBotAccounts } from 'src/lib/voting-bot'
import yargs from 'yargs'

export const command = 'voting-bot'
export const describe = 'deploy voting-bot'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()
  await setupVotingBotAccounts(argv.celoEnv)
  await installHelmChart(argv.celoEnv)

  // This is needed to stop setupVotingBotAccounts from hanging
  process.exit(0)
}
