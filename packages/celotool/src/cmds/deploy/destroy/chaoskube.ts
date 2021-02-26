import { helmReleaseName } from 'src/lib/chaoskube'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { exitIfCelotoolHelmDryRun, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'chaoskube'

export const describe = 'deploy the chaoskube package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv()
  await removeGenericHelmChart(helmReleaseName(argv.celoEnv), argv.celoEnv)
}
