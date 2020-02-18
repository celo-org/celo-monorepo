import { deployManifests, helmChartDir, helmParameters, helmReleaseName } from 'src/lib/chaos-mesh'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installGenericHelmChart } from 'src/lib/helm_deploy'
import { InitialArgv } from '../initial'

export const command = 'chaos-mesh'

export const describe = 'deploy the chaos-mesh package'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()
  await deployManifests()
  await installGenericHelmChart(
    argv.celoEnv,
    helmReleaseName(argv.celoEnv),
    helmChartDir,
    helmParameters()
  )
}
