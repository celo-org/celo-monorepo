import { switchToClusterFromEnv } from 'src/lib/cluster'
import { upgradeHelmChart } from 'src/lib/eksportisto'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'eksportisto'

export const describe = 'upgrade the eksportisto deploy'

export const builder = {}

export const handler = async (argv: UpgradeArgv) => {
  await switchToClusterFromEnv()
  await upgradeHelmChart(argv.celoEnv)
}
