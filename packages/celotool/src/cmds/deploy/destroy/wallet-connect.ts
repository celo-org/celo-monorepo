import { switchToClusterFromEnv } from 'src/lib/cluster'
import { exitIfCelotoolHelmDryRun, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { helmReleaseName } from 'src/lib/wallet-connect'
import { DestroyArgv } from '../destroy'

export const command = 'wallet-connect'

export const describe = 'deploy the wallet-connect package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv(argv.celoEnv)
  await removeGenericHelmChart(helmReleaseName(argv.celoEnv), argv.celoEnv)
}
