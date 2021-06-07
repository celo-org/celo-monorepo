import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { upgradeHelmChart } from 'src/lib/funder'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import yargs from 'yargs'

export const command = 'funder'

export const describe = 'upgrade the Accounts Funder on an AKS cluster'

type FunderUpgradeArgv = UpgradeArgv &
  ContextArgv & {
    useForno: boolean
  }

export const builder = (argv: yargs.Argv) => {
  return addContextMiddleware(argv).option('useForno', {
    description: 'Uses forno for RPCs from the funder service',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: FunderUpgradeArgv) => {
  // Do not allow --helmdryrun because komenciIdentityHelmParameters function. It could be refactored to allow
  exitIfCelotoolHelmDryRun()
  await switchToContextCluster(argv.celoEnv, argv.context)
  await upgradeHelmChart(argv.celoEnv, argv.context, argv.useForno)
}
