import { InitialArgv } from 'src/cmds/deploy/initial'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart } from 'src/lib/oracle'
import yargs from 'yargs'

export const command = 'oracle'

export const describe = 'deploy the oracle for the specified network'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()
  await installHelmChart(argv.celoEnv)
}
