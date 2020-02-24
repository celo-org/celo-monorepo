import { installHelmChart } from 'src/lib/celostats'
import { createClusterIfNotExists, setupCluster, switchToClusterFromEnv } from 'src/lib/cluster'
import yargs from 'yargs'
import { InitialArgv } from '../initial'

export const command = 'celostats'

export const describe = 'deploy the celostats package'

export const builder = (argv: yargs.Argv) => {
  return argv.option('skipClusterSetup', {
    type: 'boolean',
    description: 'If you know that you can skip the cluster setup',
    default: false,
  })
}

type CelostatsInitialArgv = InitialArgv & {
  skipClusterSetup: boolean
}

export const handler = async (argv: CelostatsInitialArgv) => {
  const createdCluster = await createClusterIfNotExists()
  await switchToClusterFromEnv()

  if (!argv.skipClusterSetup) {
    await setupCluster(argv.celoEnv, createdCluster)
  }

  await installHelmChart(argv.celoEnv)
}
