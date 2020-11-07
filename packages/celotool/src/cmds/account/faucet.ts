/* tslint:disable no-console */
import { newKit } from '@celo/contractkit'
import { sleep } from '@celo/utils/lib/async'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd } from 'src/lib/cmd-utils'
import { convertToContractDecimals } from 'src/lib/contract-utils'
import { getBlockscoutUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import { validateAccountAddress } from 'src/lib/utils'
import yargs from 'yargs'
import { AccountArgv } from '../account'

export const command = 'faucet'

export const describe = 'command for fauceting an address with gold and/or dollars'

interface FaucetArgv extends AccountArgv {
  account: string
  gold: number
  dollar: number
  checkzero: boolean
  blockscout: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('account', {
      type: 'string',
      description: 'Account(s) to faucet',
      demand: 'Please specify comma-separated accounts to faucet',
      coerce: (addresses) => {
        return addresses.split(',').map((a: string) => {
          if (!a.startsWith('0x')) {
            a = `0x${a}`
          }
          if (!validateAccountAddress(a)) {
            throw Error(`Receiver Address is invalid: "${a}"`)
          }
          return a
        })
      },
    })
    .option('dollar', {
      type: 'number',
      description: 'Number of dollars to faucet',
      demand: 'Please specify dollars to faucet',
    })
    .option('gold', {
      type: 'number',
      description: 'Amount of gold to faucet',
      demand: 'Please specify gold to faucet',
    })
    .option('checkzero', {
      type: 'boolean',
      description: 'Check that the gold balance is zero before fauceting',
      default: false,
    })
    .option('blockscout', {
      type: 'boolean',
      description: 'Open in blockscout afterwards',
      default: false,
    })
}

export const handler = async (argv: FaucetArgv) => {
  await switchToClusterFromEnv()

  const addresses = argv.account

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

    if (argv.checkzero) {
      for (const address of addresses) {
        // Check this address hasn't already been fauceted and has zero gold
        if (
          (argv.gold !== 0 && !(await goldToken.balanceOf(address)).isZero()) ||
          (argv.dollar !== 0 && !(await stableToken.balanceOf(address)).isZero())
        ) {
          console.error(
            `Unable to faucet ${address} on ${argv.celoEnv}: --checkzero specified, but balance is non-zero`
          )
          process.exit(1)
        }
      }
    }

    for (const address of addresses) {
      const goldAmount = await convertToContractDecimals(argv.gold, goldToken)
      const stableTokenAmount = await convertToContractDecimals(argv.dollar, stableToken)

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
      if (!stableTokenAmount.isZero()) {
        await stableToken.transfer(address, stableTokenAmount.toFixed()).sendAndWaitForReceipt()
      }
    }

    if (argv.blockscout) {
      // Open addresses in blockscout
      await sleep(1 + parseInt(fetchEnv(envVar.BLOCK_TIME), 10) * 1000)
      const blockscoutUrl = getBlockscoutUrl(argv.celoEnv)
      for (const address of addresses) {
        await execCmd(`open ${blockscoutUrl}/address/${address}`)
      }
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
