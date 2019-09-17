import { switchToClusterFromEnv } from 'src/lib/cluster'
import { upgradeHelmChart } from 'src/lib/transaction-metrics-exporter'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'transaction-metrics-exporter'

export const describe = 'upgrade the transaction metrics exporter deploy'

export const builder = {}

export const handler = async (argv: UpgradeArgv) => {
  await switchToClusterFromEnv()
  await upgradeHelmChart(argv.celoEnv)
}
