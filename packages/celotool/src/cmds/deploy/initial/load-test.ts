import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart } from 'src/lib/load-test'
import * as yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'

export const command = 'load-test'

export const describe = 'deploy load-test'

interface LoadTestArgv extends InitialArgv {
  blockscoutMeasurePercent: number
  replicas: number
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('blockscout-measure-percent', {
      type: 'number',
      description:
        'Percent of transactions to measure blockscout time. Must be in the range of [0, 100]',
      default: 30,
    })
    .option('replicas', {
      type: 'number',
      description: 'Number of load test clients to create',
      default: 3,
    })
}

export const handler = async (argv: LoadTestArgv) => {
  await switchToClusterFromEnv()

  await installHelmChart(argv.celoEnv, argv.blockscoutMeasurePercent, argv.replicas)
}
