import { switchToClusterFromEnvOrContext } from 'src/lib/cluster'
import { ContextArgv } from 'src/lib/context-utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { InitialArgv } from '../initial'

export const command = 'setup-cluster'

export const describe = 'Create K8s cluster and deploy common tools'

export type SetupClusterInitialArgv = InitialArgv & ContextArgv

export const handler = async (argv: SetupClusterInitialArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnvOrContext(argv, false)
}
