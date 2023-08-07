import { OdisContextName } from '@celo/identity/lib/odis/query'
import { CombinerEndpointPNP } from '@celo/phone-number-privacy-common'
import yargs from 'yargs'
import { concurrentLoadTest, serialLoadTest } from '../test'

/* tslint:disable:no-console */

const runLoadTest = (
  contextName: string,
  numWorker: number,
  isSerial: boolean,
  pnpQuotaEndpoint: boolean,
  timeoutMs: number,
  bypassQuota: boolean
) => {
  let blockchainProvider: string
  switch (contextName) {
    case 'alfajoresstaging':
    case 'alfajores':
      blockchainProvider = 'https://alfajores-forno.celo-testnet.org'
      break
    case 'mainnet':
      blockchainProvider = 'https://forno.celo.org'
      break
    default:
      console.error('Invalid contextName')
      yargs.showHelp()
      process.exit(1)
  }
  if (numWorker < 1) {
    console.error('Invalid numWorkers')
    yargs.showHelp()
    process.exit(1)
  }
  if (isSerial) {
    serialLoadTest(
      numWorker,
      blockchainProvider!,
      contextName as OdisContextName,
      pnpQuotaEndpoint ? CombinerEndpointPNP.PNP_QUOTA : CombinerEndpointPNP.PNP_SIGN,
      timeoutMs,
      bypassQuota
    )
  } else {
    concurrentLoadTest(
      numWorker,
      blockchainProvider!,
      contextName as OdisContextName,
      pnpQuotaEndpoint ? CombinerEndpointPNP.PNP_QUOTA : CombinerEndpointPNP.PNP_SIGN,
      timeoutMs,
      bypassQuota
    )
  }
}

yargs
  .scriptName('ODIS-load-test')
  .recommendCommands()
  .demandCommand(1)
  .strict(true)
  .showHelpOnFail(true)
  .command(
    'run <contextName> <numWorkers>',
    'Load test ODIS.',
    (args) =>
      args
        .positional('contextName', {
          type: 'string',
          description: 'Desired network.',
        })
        .positional('numWorkers', {
          type: 'number',
          description: 'Number of machines that will be sending request to ODIS.',
        })
        .option('isSerial', {
          type: 'boolean',
          description: 'Run test workers in series.',
          default: false,
        })
        .option('timeoutMs', {
          type: 'number',
          description: 'Timout in ms.',
          default: 10000,
        })
        .option('bypassQuota', {
          type: 'boolean',
          description: 'Bypass Signer quota check.',
          default: false,
        })
        .option('pnpQuotaEndpoint', {
          type: 'boolean',
          description:
            'Use this flag to load test PNP_QUOTA endpoint instead of PNP_SIGN endpoint.',
          default: false,
        }),
    (args) =>
      runLoadTest(
        args.contextName!,
        args.numWorkers!,
        args.isSerial,
        args.pnpQuotaEndpoint,
        args.timeoutMs,
        args.bypassQuota
      )
  ).argv
