import { createClusterIfNotExists, setupCluster, switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart } from 'src/lib/prom-to-sd-utils'
import { deploy } from 'src/lib/vm-testnet-utils'
import { InitialArgv } from '../../deploy/initial'

export const command = 'vm-testnet'
export const describe = 'upgrade a testnet on a VM'
export const builder = {}

export const handler = async (argv: InitialArgv) => {
  // set up Kubernetes cluster that will have prometheus to stackdriver statefulset
  const createdCluster = await createClusterIfNotExists()
  await switchToClusterFromEnv()
  await setupCluster(argv.celoEnv, createdCluster)
  // deploy VM testnet with Terraform
  await deploy(argv.celoEnv)
  // deploy prom to sd statefulset
  await installHelmChart(argv.celoEnv)
}
