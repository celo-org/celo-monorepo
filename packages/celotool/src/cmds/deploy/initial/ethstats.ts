import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import {
  createClusterIfNotExists,
  setupCluster,
  switchToClusterFromEnv,
} from '@celo/celotool/src/lib/cluster'
import { installHelmChart } from '@celo/celotool/src/lib/ethstats'
import yargs from 'yargs'

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
