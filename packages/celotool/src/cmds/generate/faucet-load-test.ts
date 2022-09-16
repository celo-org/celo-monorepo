/* tslint:disable no-console */
import { newKit } from '@celo/contractkit'
import { CeloTokenInfo, StableToken } from '@celo/contractkit/lib/celo-tokens'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { convertToContractDecimals } from 'src/lib/contract-utils'
import { addCeloEnvMiddleware, CeloEnvArgv, envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, generateAddress } from 'src/lib/generate_utils'
import { getIndexForLoadTestThread } from 'src/lib/geth'
import { portForwardAnd } from 'src/lib/port_forward'
import yargs from 'yargs'

interface FaucetLoadTest extends CeloEnvArgv {
  gold: number
  dollars: number
  every_stable: number
  replica_from: number
  replica_to: number
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
        description: 'Celo Dollars amount to transfer',
        default: 0,
      })
      .option('every_stable', {
        type: 'number',
        description: 'Amount to transfer for every stable',
        default: 10,
      })
      .option('replica_from', {
        type: 'number',
        description: 'Index count from',
        demandOption: 'Please specify a key index',
      })
      .option('replica_to', {
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
  await switchToClusterFromEnv(argv.celoEnv)
  const accountType = AccountType.LOAD_TESTING_ACCOUNT
  const mnemonic = fetchEnv(envVar.MNEMONIC)

  const cb = async () => {
    const kit = newKit('http://localhost:8545')
    const account = (await kit.web3.eth.getAccounts())[0]
    console.log(`Using account: ${account}`)
    kit.defaultAccount = account

    const goldToken = await kit.contracts.getGoldToken()
    const goldAmount = await convertToContractDecimals(argv.gold, goldToken)

    for (let podIndex = argv.replica_from; podIndex <= argv.replica_to; podIndex++) {
      for (let threadIndex = argv.threads_from; threadIndex <= argv.threads_to; threadIndex++) {
        const index = getIndexForLoadTestThread(podIndex, threadIndex)
        const address = generateAddress(mnemonic, accountType, index)
        if (goldAmount.isGreaterThan(0)) {
          console.log(`${index} --> Fauceting ${goldAmount.toFixed()} Gold to ${address}`)
          await goldToken.transfer(address, goldAmount.toFixed()).send()
        }
        kit.celoTokens.forStableCeloToken(async (info: CeloTokenInfo) => {
          let amountToTransfer = argv.every_stable
          if (info.symbol === StableToken.cUSD && argv.dollars > amountToTransfer) {
            amountToTransfer = argv.dollars
          }
          if (amountToTransfer != 0) {
            const wrapper = await kit.contracts.getContract(info.contract)
            const stableAmount = await convertToContractDecimals(amountToTransfer, wrapper)
            console.log(
              `${index} --> Fauceting ${stableAmount.toFixed()} ${info.symbol} to ${address}`
            )
            await wrapper.transfer(address, stableAmount.toFixed()).send()
          }
        })
      }
    }
  }

  try {
    await portForwardAnd(argv.celoEnv, cb)
    await cb
  } catch (error) {
    console.error(`Unable to faucet load-test accounts on ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
