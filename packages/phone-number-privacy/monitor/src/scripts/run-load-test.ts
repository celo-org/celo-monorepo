import { concurrentLoadTest } from '../test'

/* tslint:disable:no-console */

const args = process.argv.slice(2)

const printHelpAndExit = () => {
  console.log('Usage: yarn loadTest <network> <numWorkers>')
  process.exit(1)
}

if (args[0] === '--help' || args.length !== 2) {
  printHelpAndExit()
}

switch (args[0]) {
  case 'alfajores':
    process.env.BLOCKCHAIN_PROVIDER = 'https://alfajores-forno.celo-testnet.org'
    break
  case 'mainnet':
    process.env.BLOCKCHAIN_PROVIDER = 'https://forno.celo.org'
    break
  default:
    printHelpAndExit()
    break
}
process.env.NETWORK = args[0]

concurrentLoadTest(Number(args[1])) // tslint:disable-line:no-floating-promises
