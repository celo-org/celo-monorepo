import { createClusterIfNotExists, setupCluster, switchToClusterFromEnv } from 'src/lib/cluster'
import { failIfVmBased } from 'src/lib/env-utils'
import { createStaticIPs, installHelmChart, pollForBootnodeLoadBalancer } from 'src/lib/helm_deploy'
import { uploadTestnetInfoToGoogleStorage } from 'src/lib/testnet-utils'
import yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'

export const command = 'testnet'

export const describe = 'deploy the testnet package'

type TestnetInitialArgv = InitialArgv & {
  skipClusterSetup: boolean
  useExistingGenesis: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('skipClusterSetup', {
      type: 'boolean',
      description: 'If you know that you can skip the cluster setup',
      default: false,
    })
    .option('useExistingGenesis', {
      type: 'boolean',
      description: 'Instead of generating a new genesis, use an existing genesis in GCS',
      default: false,
    })
}

export const handler = async (argv: TestnetInitialArgv) => {
  failIfVmBased()

  const createdCluster = await createClusterIfNotExists()
  await switchToClusterFromEnv()

  if (!argv.skipClusterSetup) {
    await setupCluster(argv.celoEnv, createdCluster)
  }

  await createStaticIPs(argv.celoEnv)

  await installHelmChart(argv.celoEnv, argv.useExistingGenesis)
  // When using an external bootnode, we have to await the bootnode's LB to be up first
  await pollForBootnodeLoadBalancer(argv.celoEnv)

  await uploadTestnetInfoToGoogleStorage(argv.celoEnv, !argv.useExistingGenesis)
}
