import { createClusterIfNotExists, setupCluster, switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart } from 'src/lib/ethstats'
import yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'

export const command = 'ethstats'

export const describe = 'deploy the ethstats package'

export const builder = (argv: yargs.Argv) => {
  return argv.option('skipClusterSetup', {
    type: 'boolean',
    description: 'If you know that you can skip the cluster setup',
    default: false,
  })
}

type EthstatsInitialArgv = InitialArgv & {
  skipClusterSetup: boolean
}

export const handler = async (argv: EthstatsInitialArgv) => {
  const createdCluster = await createClusterIfNotExists()
  await switchToClusterFromEnv()

  if (!argv.skipClusterSetup) {
    await setupCluster(argv.celoEnv, createdCluster)
  }

  await installHelmChart(argv.celoEnv)
}
