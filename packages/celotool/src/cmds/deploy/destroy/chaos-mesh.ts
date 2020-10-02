import { helmReleaseName } from 'src/lib/chaos-mesh'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { removeGenericHelmChart } from 'src/lib/helm_deploy'
import { DestroyArgv } from '../destroy'

export const command = 'chaos-mesh'

export const describe = 'deploy the chaos-mesh package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv()
  await removeGenericHelmChart(helmReleaseName(argv.celoEnv))
}
