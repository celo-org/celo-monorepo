import { switchToClusterFromEnv } from 'src/lib/cluster'
import { upgradeHelmChart } from 'src/lib/prom-to-sd-utils'
import { deploy, taintTestnet, untaintTestnet } from 'src/lib/vm-testnet-utils'
import yargs from 'yargs'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'vm-testnet'
export const describe = 'upgrade a testnet on a VM'

type VmTestnetArgv = UpgradeArgv & {
  reset: boolean
  skipSecretGeneration: boolean
  useExistingGenesis: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('reset', {
      describe: 'recreates all nodes and deletes any chain data in persistent disks',
      default: false,
      type: 'boolean',
    })
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
  await switchToClusterFromEnv()

  let onDeployFailed = () => Promise.resolve()
  if (argv.reset === true) {
    onDeployFailed = () => untaintTestnet(argv.celoEnv)
    await taintTestnet(argv.celoEnv)
  }
  await deploy(argv.celoEnv, !argv.skipSecretGeneration, argv.useExistingGenesis, onDeployFailed)

  // upgrade prom to sd statefulset
  await upgradeHelmChart(argv.celoEnv)
}
