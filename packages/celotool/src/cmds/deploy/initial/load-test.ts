import { switchToClusterFromEnv } from 'src/lib/cluster'
import { CeloEnvArgv, envVar, fetchEnv } from 'src/lib/env-utils'
import { installHelmChart } from 'src/lib/load-test'
import yargs from 'yargs'

export const command = 'load-test'

export const describe = 'deploy load-test'

export interface LoadTestArgv extends CeloEnvArgv {
  blockscoutMeasurePercent: number
  delay: number
  replicas: number
  threads: number
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('blockscout-measure-percent', {
      type: 'number',
      description:
        'Percent of transactions to measure the time it takes for blockscout to process a transaction. Should be in the range of [0, 100]',
      default: 30,
    })
    .option('delay', {
      type: 'number',
      description:
        'Number of ms a client waits between each transaction, defaults to LOAD_TEST_TX_DELAY_MS in the .env file',
      default: -1,
    })
    .option('replicas', {
      type: 'number',
      description:
        'Number of load test clients to create, defaults to LOAD_TEST_CLIENTS in the .env file',
      default: -1,
    })
    .option('threads', {
      type: 'number',
      description:
        'Number of threads for each client, defaults to LOAD_TEST_THREADS in the .env file',
      default: -1,
    })
}

export function setArgvDefaults(argv: LoadTestArgv) {
  // Variables from the .env file are not set as environment variables
  // by the time the builder is run, so we set the default here
  if (argv.delay < 0) {
    argv.delay = parseInt(fetchEnv(envVar.LOAD_TEST_TX_DELAY_MS), 10)
  }
  if (argv.replicas < 0) {
    argv.replicas = parseInt(fetchEnv(envVar.LOAD_TEST_CLIENTS), 10)
  }
  if (argv.threads < 0) {
    argv.replicas = parseInt(fetchEnv(envVar.LOAD_TEST_THREADS), 1)
  }
}

export const handler = async (argv: LoadTestArgv) => {
  await switchToClusterFromEnv()
  setArgvDefaults(argv)

  await installHelmChart(
    argv.celoEnv,
    argv.blockscoutMeasurePercent,
    argv.delay,
    argv.replicas,
    argv.threads
  )
}
