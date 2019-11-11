/* tslint:disable no-console */
import { newKit } from '@celo/contractkit'
import { convertToContractDecimals } from 'src/lib/contract-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import { validateAccountAddress } from 'src/lib/utils'
import * as yargs from 'yargs'
import { AccountArgv } from '../account'

export const command = 'faucet'

export const describe = 'command for fauceting an address with gold and dollars'

interface FaucetArgv extends AccountArgv {
  account: string
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('account', {
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
}

export const handler = async (argv: FaucetArgv) => {
  const address = argv.account

  const cb = async () => {
    const kit = newKit('http://localhost:8545')
    const account = (await kit.web3.eth.getAccounts())[0]
    console.log(`Using account: ${account}`)
    kit.defaultAccount = account

    const [goldToken, stableToken] = await Promise.all([
      kit.contracts.getGoldToken(),
      kit.contracts.getStableToken(),
    ])
    const goldAmount = (await convertToContractDecimals(1, goldToken)).toString()
    const stableTokenAmount = (await convertToContractDecimals(10, stableToken)).toString()

    console.log(`Fauceting ${goldAmount} Gold and ${stableTokenAmount} StableToken to ${address}`)
    await Promise.all([
      goldToken.transfer(address, goldAmount).sendAndWaitForReceipt(),
      stableToken.transfer(address, stableTokenAmount).sendAndWaitForReceipt(),
    ])
  }

  try {
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to faucet ${argv.account} on ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
