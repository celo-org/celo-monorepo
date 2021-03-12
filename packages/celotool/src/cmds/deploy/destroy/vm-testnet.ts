import { switchToClusterFromEnv } from 'src/lib/cluster'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { removePrometheus } from 'src/lib/prometheus'
import { destroy } from 'src/lib/vm-testnet-utils'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'vm-testnet'
export const describe = 'destroy an existing VM-based testnet'
export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv(argv.celoEnv)
  await destroy(argv.celoEnv)
  await removePrometheus()
}
