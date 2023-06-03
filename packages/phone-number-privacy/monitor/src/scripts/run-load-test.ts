import { OdisContextName } from '@celo/identity/lib/odis/query'
import yargs from 'yargs'
import { concurrentLoadTest, serialLoadTest } from '../test'

/* tslint:disable:no-console */

const runLoadTest = (contextName: string, numWorker: number, isSerial: boolean) => {
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
      console.error('invalid contextName')
      process.exit(1)
  }

  if (isSerial) {
    serialLoadTest(numWorker, blockchainProvider!, contextName as OdisContextName) // tslint:disable-line:no-floating-promises
  } else {
    concurrentLoadTest(numWorker, blockchainProvider!, contextName as OdisContextName) // tslint:disable-line:no-floating-promises
  }
}
// tslint:disable-next-line: no-unused-expression
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
          description: 'run test workers in series.',
          default: false,
        }),
    (args) => runLoadTest(args.contextName!, args.numWorkers!, args.isSerial)
  ).argv
