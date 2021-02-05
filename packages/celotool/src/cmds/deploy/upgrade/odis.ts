import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { upgradeODISChart } from 'src/lib/odis'
import yargs from 'yargs'

export const command = 'odis'

export const describe = 'upgrade odis on an AKS cluster'

type OracleUpgradeArgv = UpgradeArgv & ContextArgv

export const handler = async (argv: OracleUpgradeArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  await upgradeODISChart(argv.celoEnv, argv.context)
}
