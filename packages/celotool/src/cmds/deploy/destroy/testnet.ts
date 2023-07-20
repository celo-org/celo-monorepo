import { switchToClusterFromEnv } from 'src/lib/cluster'
import { deleteFromCluster, deleteStaticIPs, exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'testnet'
export const describe = 'destroy an existing deploy of the testnet package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  exitIfCelotoolHelmDryRun()

  await switchToClusterFromEnv(argv.celoEnv)

  await deleteFromCluster(argv.celoEnv)
  await deleteStaticIPs(argv.celoEnv)
}
