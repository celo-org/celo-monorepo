import { createClusterIfNotExists, setupCluster, switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart } from 'src/lib/prom-to-sd-utils'
import { deploy } from 'src/lib/vm-testnet-utils'
import yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'

export const command = 'vm-testnet'
export const describe = 'upgrade a testnet on a VM'

type VmTestnetArgv = InitialArgv & {
  skipSecretGeneration: boolean
  useExistingGenesis: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('skipSecretGeneration', {
      describe:
        'Skips the generation of secrets. Use sparingly, this is intended to save deploy time if you are certain no secrets will have changed.',
      default: false,
      type: 'boolean',
    })
    .option('useExistingGenesis', {
      type: 'boolean',
      description: 'Instead of generating a new genesis, use an existing genesis in GCS',
      default: false,
    })
}

export const handler = async (argv: VmTestnetArgv) => {
  // deploy VM testnet with Terraform
  await deploy(argv.celoEnv, !argv.skipSecretGeneration, argv.useExistingGenesis)

  // set up Kubernetes cluster that will have prometheus to stackdriver statefulset
  const createdCluster = await createClusterIfNotExists()
  await switchToClusterFromEnv()
  await setupCluster(argv.celoEnv, createdCluster)

  // deploy prom to sd statefulset
  await installHelmChart(argv.celoEnv)
}
