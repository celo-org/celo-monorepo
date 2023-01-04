import { OdisContextName } from '@celo/identity/lib/odis/query'
import { concurrentLoadTest } from '../test'

/* tslint:disable:no-console */

const args = process.argv.slice(2)

const printHelpAndExit = () => {
  console.log('Usage: yarn loadTest <contextname> <numWorkers>')
  process.exit(1)
}

if (args[0] === '--help' || args.length !== 2) {
  printHelpAndExit()
}

let blockchainProvider: string
switch (args[0]) {
  case 'alfajoresstaging':
  case 'alfajores':
    blockchainProvider = 'https://alfajores-forno.celo-testnet.org'
    break
  case 'mainnet':
    blockchainProvider = 'https://forno.celo.org'
    break
  default:
    printHelpAndExit()
    break
}

concurrentLoadTest(Number(args[1]), blockchainProvider!, args[0] as OdisContextName) // tslint:disable-line:no-floating-promises
