import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart } from 'src/lib/eksportisto'
import { InitialArgv } from '../../deploy/initial'

export const command = 'eksportisto'

export const describe = 'deploy eksportisto'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()

  await installHelmChart(argv.celoEnv)
}
