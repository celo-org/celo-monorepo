import { helmChartDir, helmParameters, helmReleaseName } from 'src/lib/chaoskube'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import { InitialArgv } from '../../deploy/initial'

export const command = 'chaoskube'

export const describe = 'deploy the chaoskube package'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()
  await upgradeGenericHelmChart(
    argv.celoEnv,
    helmReleaseName(argv.celoEnv),
    helmChartDir,
    helmParameters(argv.celoEnv)
  )
}
