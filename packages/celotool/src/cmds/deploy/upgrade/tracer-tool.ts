import { UpgradeArgv } from '@celo/celotool/src/cmds/deploy/upgrade'
import { switchToClusterFromEnv } from '@celo/celotool/src/lib/cluster'
import { upgradeHelmChart } from 'src/lib/tracer-tool'

export const command = 'tracer-tool'

export const describe = 'upgrade the tracer-tool deployment'

export const builder = {}

export const handler = async (argv: UpgradeArgv) => {
  await switchToClusterFromEnv()
  await upgradeHelmChart(argv.celoEnv)
}
