import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import { fetchEnv } from '@celo/celotool/src/lib/utils'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installHelmChart } from 'src/lib/load-test'
import * as yargs from 'yargs'

export const command = 'load-test'

export const describe = 'deploy load-test'

const MAX_REPLICAS_COUNT = 10000

interface LoadTestArgv extends InitialArgv {
  replicas: number
  loadTestId: string
  blockscoutProb: number
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('replicas', {
      type: 'number',
      description: 'Number of replicas',
      default: 1,
    })
    .option('load-test-id', {
      type: 'string',
      description: 'Unique identifier used to distinguish between ran load-tests',
      demand: 'Please, specify the load test unique identifier',
    })
    .option('blockscout-prob', {
      type: 'number',
      description: 'Probability of checking the blockscout transaction status',
      default: 30,
    })
}

export const handler = async (argv: LoadTestArgv) => {
  await switchToClusterFromEnv()

  const mnemonic = fetchEnv('MNEMONIC')

  const replicas = argv.replicas
  if (replicas < 0 || replicas > MAX_REPLICAS_COUNT) {
    console.error(
      `Invalid replicas count: it should be more than zero and not greater than ${MAX_REPLICAS_COUNT}`
    )
  }

  await installHelmChart(argv.celoEnv, argv.loadTestId, argv.blockscoutProb, replicas, mnemonic)
}
