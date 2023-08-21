import { OdisContextName } from '@celo/identity/lib/odis/query'
import yargs from 'yargs'
import { concurrentRPSLoadTest } from '../test'

// tslint:disable-next-line: no-unused-expression
yargs
  .scriptName('ODIS-load-test')
  .recommendCommands()
  .demandCommand(1)
  .strict(true)
  .showHelpOnFail(true)
  .command(
    'run <contextName> <rps>',
    'Load test ODIS.',
    (args) =>
      args
        .positional('contextName', {
          type: 'string',
          description: 'Desired network.',
        })
        .positional('rps', {
          type: 'number',
          description: 'Number of requests per second to generate',
        }),
    (args) => {
      if (args.rps == null || args.contextName == null) {
        console.error('missing positional arguments')
        yargs.showHelp()
        process.exit(1)
      }

      const rps = args.rps!
      const contextName = args.contextName! as OdisContextName

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

      if (rps < 1) {
        console.error('Invalid rps')
        yargs.showHelp()
        process.exit(1)
      }
      concurrentRPSLoadTest(args.rps, blockchainProvider!, contextName) // tslint:disable-line:no-floating-promises
    }
  ).argv
