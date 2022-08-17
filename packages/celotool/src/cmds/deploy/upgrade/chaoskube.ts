import { helmChartDir, helmParameters, helmReleaseName } from 'src/lib/chaoskube'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { InitialArgv } from '../../deploy/initial'

export const command = 'chaoskube'

export const describe = 'deploy the chaoskube package'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  await (argv.celoEnv, helmReleaseName(argv.celoEnv), helmChartDir, helmParameters(argv.celoEnv))
}
