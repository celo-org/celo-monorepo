/* tslint:disable no-console */
import { newKit } from '@celo/contractkit'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { convertToContractDecimals } from 'src/lib/contract-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import { validateAccountAddress } from 'src/lib/utils'
import yargs from 'yargs'
import { AccountArgv } from '../account'

export const command = 'faucet'

export const describe = 'command for fauceting an address with gold and/or dollars'

interface FaucetArgv extends AccountArgv {
  account: string
  gold: number
  dollars: number
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('account', {
      type: 'string',
      description: 'Account to faucet',
      demand: 'Please specify account to faucet',
      coerce: (address) => {
        if (!validateAccountAddress(address)) {
          throw Error(`Receiver Address is invalid: "${address}"`)
        }
        return address
      },
    })
    .option('dollars', {
      type: 'number',
      description: 'Number of dollars to faucet',
      default: 0,
    })
    .option('gold', {
      type: 'number',
      description: 'Amount of gold to faucet',
      default: 0,
    })
}

export const handler = async (argv: FaucetArgv) => {
  await switchToClusterFromEnv()

  const address = argv.account

  const cb = async () => {
    const kit = newKit('http://localhost:8545')
    const account = (await kit.web3.eth.getAccounts())[0]
    console.log(`Using account: ${account}`)
    kit.defaultAccount = account

    const [goldToken, stableToken, reserve] = await Promise.all([
      kit.contracts.getGoldToken(),
      kit.contracts.getStableToken(),
      kit.contracts.getReserve(),
    ])
    const goldAmount = await convertToContractDecimals(argv.gold, goldToken)
    const stableTokenAmount = await convertToContractDecimals(argv.dollars, stableToken)
    console.log(
      `Fauceting ${goldAmount.toFixed()} Gold and ${stableTokenAmount.toFixed()} StableToken to ${address}`
    )
    if (!goldAmount.isZero()) {
      if (await reserve.isSpender(account)) {
        await reserve.transferGold(address, goldAmount.toFixed()).sendAndWaitForReceipt()
      } else {
        await goldToken.transfer(address, goldAmount.toFixed()).sendAndWaitForReceipt()
      }
    }
    if (stableTokenAmount.isZero()) {
      await stableToken.transfer(address, stableTokenAmount.toFixed()).sendAndWaitForReceipt()
    }
  }

  try {
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to faucet ${argv.account} on ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
