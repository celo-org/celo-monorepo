import { switchToClusterFromEnv } from 'src/lib/cluster'
import { exitIfCelotoolHelmDryRun, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { helmReleaseName } from 'src/lib/pumba'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'pumba'

export const describe = 'deploy the pumba package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv()
  await removeGenericHelmChart(helmReleaseName(argv.celoEnv), argv.celoEnv)
}
