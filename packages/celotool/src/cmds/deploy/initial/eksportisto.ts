import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart } from 'src/lib/eksportisto'
import yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'

export const command = 'eksportisto'

export const describe = 'deploy eksportisto'

type EksportistoInitialArgv = InitialArgv & {
  chartVersion: number
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('chartVersion', {
    description: 'Chart Version to use (1 or 2)',
    default: 1,
    type: 'number',
  })
}

export const handler = async (argv: EksportistoInitialArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  await installHelmChart(argv.celoEnv, argv.chartVersion)
}
