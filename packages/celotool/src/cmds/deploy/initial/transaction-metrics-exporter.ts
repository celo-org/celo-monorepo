import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart } from 'src/lib/transaction-metrics-exporter'
import { InitialArgv } from '../../deploy/initial'

export const command = 'transaction-metrics-exporter'

export const describe = 'deploy the transaction metrics exporter'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()

  await installHelmChart(argv.celoEnv)
}
