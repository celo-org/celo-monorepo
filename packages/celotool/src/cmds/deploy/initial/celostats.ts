import { installHelmChart } from 'src/lib/celostats'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { InitialArgv } from '../initial'

export const command = 'celostats'

export const describe = 'deploy the celostats package'

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()
  await installHelmChart(argv.celoEnv)
}
