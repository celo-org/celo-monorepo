/* tslint:disable no-console */
import { newKitFromWeb3 } from '@celo/contractkit'
import {
  celoTokenInfos,
  CeloTokenType,
  StableToken,
  Token,
} from '@celo/contractkit/lib/celo-tokens'
import { sleep } from '@celo/utils/lib/async'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd } from 'src/lib/cmd-utils'
import { convertToContractDecimals } from 'src/lib/contract-utils'
import { getBlockscoutUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import { validateAccountAddress } from 'src/lib/utils'
import Web3 from 'web3'
import yargs from 'yargs'
import { AccountArgv } from '../account'

export const command = 'faucet'

export const describe = 'command for fauceting an address with gold and/or dollars'

interface FaucetArgv extends AccountArgv {
  account: string
  gold: number
  dollar: number
  // TODO rename stable
  stable: TokensArgs[]
  checkzero: boolean
  blockscout: boolean
}
interface TokensArgs {
  token: CeloTokenType
  amount: number
}

export const builder = (argv: yargs.Argv) => {
  return (
    argv
      .option('account', {
        type: 'string',
        description: 'Account(s) to faucet',
        demand: 'Please specify comma-separated accounts to faucet',
        coerce: (addresses) => {
          console.log(addresses)
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
      // TODO EN: rename this
      .array('stable')
      .option('stable', {
        type: 'string',
        description: 'stableToken,amount pair to faucet',
        demand: 'Please specify stableToken,amount pairs to faucet (ex: --stable cUSD,10 cEUR,5)',
        coerce: (pairs) => {
          // Ensure that pairs are formatted properly and use possible tokens
          const validCeloTokens = Object.values(celoTokenInfos).map((tokenInfo) => {
            return tokenInfo.symbol
          })
          console.log('Valid tokens: ', validCeloTokens)
          return pairs.map((pair: string) => {
            let [token, amount] = pair.split(',')

            if (!validCeloTokens.includes(token as CeloTokenType)) {
              throw Error(`Invalid token '${token}', must be one of: ${validCeloTokens}.`)
            }
            if (!(amount && /^\d+$/.test(amount))) {
              throw Error(`Invalid amount '${amount}', must consist of only numbers.`)
            }
            return {
              token: token as StableToken,
              amount: Number(amount),
            }
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
        description: 'Check that the balance is zero before fauceting',
        default: false,
      })
      .option('blockscout', {
        type: 'boolean',
        description: 'Open in blockscout afterwards',
        default: false,
      })
  )
}

export const handler = async (argv: FaucetArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  // TODO: get rid of this
  console.log('Beep boop: ', argv.stable)
  const addresses = argv.account

  const cb = async () => {
    const web3 = new Web3('http://localhost:8545')
    const kit = newKitFromWeb3(web3)
    const account = (await kit.connection.getAccounts())[0]
    console.log(`Using account: ${account}`)
    kit.connection.defaultAccount = account

    // const [goldToken, stableToken, reserve] = await Promise.all([
    //   kit.contracts.getGoldToken(),
    //   kit.contracts.getStableToken(),
    //   kit.contracts.getReserve(),
    // ])
    // if (argv.checkzero) {
    //   for (const address of addresses) {
    //     // Check this address hasn't already been fauceted and has zero gold
    //     if (
    //       (argv.gold !== 0 && !(await goldToken.balanceOf(address)).isZero()) ||
    //       (argv.dollar !== 0 && !(await stableToken.balanceOf(address)).isZero())
    //     ) {
    //       console.error(
    //         `Unable to faucet ${address} on ${argv.celoEnv}: --checkzero specified, but balance is non-zero`
    //       )
    //       process.exit(1)
    //     }
    //   }
    // }

    // for (const address of addresses) {
    //   const goldAmount = await convertToContractDecimals(argv.gold, goldToken)
    //   const stableTokenAmount = await convertToContractDecimals(argv.dollar, stableToken)

    //   console.log(
    //     `Fauceting ${goldAmount.toFixed()} Gold and ${stableTokenAmount.toFixed()} StableToken to ${address}`
    //   )

    //   if (!goldAmount.isZero()) {
    //     if (await reserve.isSpender(account)) {
    //       await reserve.transferGold(address, goldAmount.toFixed()).sendAndWaitForReceipt()
    //     } else {
    //       await goldToken.transfer(address, goldAmount.toFixed()).sendAndWaitForReceipt()
    //     }
    //   }
    //   if (!stableTokenAmount.isZero()) {
    //     await stableToken.transfer(address, stableTokenAmount.toFixed()).sendAndWaitForReceipt()
    //   }
    // }
    const reserve = await kit.contracts.getReserve()

    // TODO change this to helper function + async map (instead of for loop?)
    for (const tokenArgs of argv.stable) {
      console.log(tokenArgs)
      if (!tokenArgs.amount) {
        continue
      }

      // TODO remove if we don't need this in particular
      const tokenInfo = celoTokenInfos[tokenArgs.token]
      console.log('tokenInfo: ', tokenInfo)

      const tokenWrapper = await kit.celoTokens.getWrapper(tokenArgs.token as any)

      // const faucetAddress = async (address, tokenWrapper) => {
      // }
      for (const address of addresses) {
        if (argv.checkzero) {
          // Exit if address account balance of this token is zero
          if (!(await tokenWrapper.balanceOf(address)).isZero()) {
            console.error(
              `Unable to faucet ${tokenArgs.token} to ${address} on ${argv.celoEnv}: --checkzero specified, but balance is non-zero`
            )
            process.exit(1)
          }
        }
        const tokenAmount = await convertToContractDecimals(tokenArgs.amount, tokenWrapper)
        console.log(`Fauceting ${tokenAmount.toFixed()} of ${tokenArgs.token} to ${address}`)

        if (tokenArgs.token == Token.CELO && (await reserve.isSpender(account))) {
          await reserve.transferGold(address, tokenAmount.toFixed()).sendAndWaitForReceipt()
        } else {
          // Normal transfer of token to address
          await tokenWrapper.transfer(address, tokenAmount.toFixed()).sendAndWaitForReceipt()
        }
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
