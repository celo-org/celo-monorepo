import { switchToClusterFromEnv } from 'src/lib/cluster'
import { upgradeHelmChart } from 'src/lib/eksportisto'
import yargs from 'yargs'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'eksportisto'

export const describe = 'upgrade the eksportisto deploy'

type EksportistoUpgradeArgv = UpgradeArgv & {
  chartVersion: number
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('chartVersion', {
    description: 'Chart Version to use (1 or 2)',
    default: 1,
    type: 'number',
  })
}

export const handler = async (argv: EksportistoUpgradeArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  await upgradeHelmChart(argv.celoEnv, argv.chartVersion)
}
