import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import { createClusterIfNotExists, setupCluster, switchToClusterFromEnv } from 'src/lib/cluster'
import { createStaticIPs, installHelmChart, pollForBootnodeLoadBalancer } from 'src/lib/helm_deploy'
import {
  uploadGenesisBlockToGoogleStorage,
  uploadStaticNodesToGoogleStorage,
} from 'src/lib/testnet-utils'
import yargs from 'yargs'

export const command = 'testnet'

export const describe = 'deploy the testnet package'

export const builder = (argv: yargs.Argv) => {
  return argv.option('skipClusterSetup', {
    type: 'boolean',
    description: 'If you know that you can skip the cluster setup',
    default: false,
  })
}

type TestnetInitialArgv = InitialArgv & { skipClusterSetup: boolean }

export const handler = async (argv: TestnetInitialArgv) => {
  const createdCluster = await createClusterIfNotExists()
  await switchToClusterFromEnv()

  if (!argv.skipClusterSetup) {
    await setupCluster(argv.celoEnv, createdCluster)
  }

  await createStaticIPs(argv.celoEnv)

  await installHelmChart(argv.celoEnv)
  // When using an external bootnode, we have to await the bootnode's LB to be up first
  await pollForBootnodeLoadBalancer(argv.celoEnv)

  await uploadGenesisBlockToGoogleStorage(argv.celoEnv)
  await uploadStaticNodesToGoogleStorage(argv.celoEnv)
}
