import { switchToClusterFromEnv } from 'src/lib/cluster'
import { upgradeHelmChart } from 'src/lib/tracer-tool'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'tracer-tool'

export const describe = 'upgrade the tracer-tool deployment'

export const builder = {}

export const handler = async (argv: UpgradeArgv) => {
  await switchToClusterFromEnv()
  await upgradeHelmChart(argv.celoEnv)
}
