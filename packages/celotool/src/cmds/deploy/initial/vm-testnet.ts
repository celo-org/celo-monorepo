import { installHelmChart } from 'src/lib/prom-to-sd-utils'
import { deploy } from 'src/lib/vm-testnet-utils'
import { InitialArgv } from '../../deploy/initial'

export const command = 'vm-testnet'
export const describe = 'upgrade a testnet on a VM'
export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await deploy(argv.celoEnv)
  await installHelmChart(argv.celoEnv)
}
