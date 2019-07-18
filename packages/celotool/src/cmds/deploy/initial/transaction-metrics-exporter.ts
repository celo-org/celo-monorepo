import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import { switchToClusterFromEnv } from '@celo/celotool/src/lib/cluster'
import { installHelmChart } from 'src/lib/transaction-metrics-exporter'

export const command = 'transaction-metrics-exporter'

export const describe = 'deploy the transaction metrics exporter'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()

  await installHelmChart(argv.celoEnv)
}
