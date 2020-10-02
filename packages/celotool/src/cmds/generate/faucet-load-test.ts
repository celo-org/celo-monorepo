/* tslint:disable no-console */
import { newKit } from '@celo/contractkit'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { convertToContractDecimals } from 'src/lib/contract-utils'
import { addCeloEnvMiddleware, CeloEnvArgv, envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, generateAddress } from 'src/lib/generate_utils'
import yargs from 'yargs'

interface FaucetLoadTest extends CeloEnvArgv {
  count_from: number
  gold: number
  dollars: number
  count_to: number
  threads_from: number
  threads_to: number
}

export const command = 'faucet-load-test'

export const describe = 'command for fauceting the addresses used for load testing'

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(
    argv
      .option('gold', {
        type: 'number',
        description: 'Celo Gold amount to transfer',
        default: 10,
      })
      .option('dollars', {
        type: 'number',
        description: 'Celo Gold amount to transfer',
        default: 10,
      })
      .option('count_from', {
        type: 'number',
        description: 'Index count from',
        demandOption: 'Please specify a key index',
      })
      .option('count_to', {
        type: 'number',
        description: 'Index count to',
        demandOption: 'Please specify a key index',
      })
      .option('threads_from', {
        type: 'number',
        description: 'Index of key to generate',
        demandOption: 'Please specify a key threads_from',
      })
      .option('threads_to', {
        type: 'number',
        description: 'Index of key to generate',
        demandOption: 'Please specify a key threads_to',
      })
  )
}

export const handler = async (argv: CeloEnvArgv & FaucetLoadTest) => {
  await switchToClusterFromEnv()
  const accountType = AccountType.LOAD_TESTING_ACCOUNT
  const mnemonic = fetchEnv(envVar.MNEMONIC)

  const kit = newKit('http://localhost:8545')
  const account = (await kit.web3.eth.getAccounts())[0]
  console.log(`Using account: ${account}`)
  kit.defaultAccount = account

  const [goldToken] = await Promise.all([kit.contracts.getGoldToken()])
  const goldAmount = await convertToContractDecimals(argv.gold, goldToken)

  for (let i = argv.count_from; i <= argv.count_to; i++) {
    for (let t = argv.threads_from; t <= argv.threads_to; t++) {
      const index = parseInt(`${i}${t}`, 10)
      const address = generateAddress(mnemonic, accountType, index)
      console.log(`${index} --> Fauceting ${goldAmount.toFixed()} Gold to ${address}`)
      await goldToken.transfer(address, goldAmount.toFixed()).send()
    }
  }
}
