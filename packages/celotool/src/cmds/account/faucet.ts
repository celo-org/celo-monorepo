import { newKitFromWeb3 } from '@celo/contractkit'
import { celoTokenInfos, CeloTokenType, Token } from '@celo/contractkit/lib/celo-tokens'
import { concurrentMap, sleep } from '@celo/utils/lib/async'
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
  tokenParams: TokenParams[]
  checkZero: boolean
  checkDeployed: boolean
  blockscout: boolean
}
interface TokenParams {
  token: CeloTokenType
  amount: number
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
    .array('tokenParams')
    .option('tokenParams', {
      type: 'string',
      description: '<token,amount> pair to faucet',
      demand:
        'Please specify stableToken,amount pairs to faucet (ex: --tokenParams CELO,3 cUSD,10 cEUR,5)',
      coerce: (pairs) => {
        // Ensure that pairs are formatted properly and use possible tokenParams
        const validCeloTokens = Object.values(celoTokenInfos).map((tokenInfo) => {
          return tokenInfo.symbol
        })
        return pairs.map((pair: string) => {
          const [token, amount] = pair.split(',')
          if (token === undefined || amount === undefined) {
            throw Error(`Format of tokenParams should be: --tokenParams tokenName,amount`)
          }
          // Note: this does not check if token has been deployed on network
          if (!validCeloTokens.includes(token as CeloTokenType)) {
            throw Error(`Invalid token '${token}', must be one of: ${validCeloTokens.join('|')}.`)
          }
          if (!(amount && /^\d+$/.test(amount))) {
            throw Error(`Invalid amount '${amount}', must consist of only numbers.`)
          }
          return {
            token: token as CeloTokenType,
            amount: Number(amount),
          }
        })
      },
    })
    .option('checkZero', {
      type: 'boolean',
      description: 'Check that the balance is zero before fauceting',
      default: false,
    })
    .option('checkDeployed', {
      type: 'boolean',
      description: 'Check that token is deployed on current network',
      default: false,
    })
    .option('blockscout', {
      type: 'boolean',
      description: 'Open in blockscout afterwards',
      default: false,
    })
}

export const handler = async (argv: FaucetArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  const addresses = argv.account

  const cb = async () => {
    const web3 = new Web3('http://localhost:8545')
    const kit = newKitFromWeb3(web3)
    const account = (await kit.connection.getAccounts())[0]
    console.info(`Using account: ${account}`)
    kit.connection.defaultAccount = account

    // Check that input token has been deployed to this network
    if (argv.checkDeployed) {
      const deployedCeloTokens = Object.values(await kit.celoTokens.validCeloTokenInfos()).map(
        (tokenInfo) => {
          return tokenInfo.symbol
        }
      )
      argv.tokenParams.map((tokenParam) => {
        if (!deployedCeloTokens.includes(tokenParam.token)) {
          throw Error(
            `Invalid token '${tokenParam.token}' (or not yet deployed on ${
              argv.celoEnv
            }) must be one of: ${deployedCeloTokens.join('|')}.`
          )
        }
      })
    }

    const faucetToken = async (tokenParams: TokenParams) => {
      if (!tokenParams.amount) {
        return
      }

      const tokenWrapper = await kit.celoTokens.getWrapper(tokenParams.token as any)
      for (const address of addresses) {
        if (argv.checkZero) {
          // Throw error if address account balance of this token is not zero
          if (!(await tokenWrapper.balanceOf(address)).isZero()) {
            throw Error(
              `Unable to faucet ${tokenParams.token} to ${address} on ${argv.celoEnv}: --checkZero specified, but balance is non-zero`
            )
          }
        }
        const tokenAmount = await convertToContractDecimals(tokenParams.amount, tokenWrapper)
        console.info(`Fauceting ${tokenAmount.toFixed()} of ${tokenParams.token} to ${address}`)

        if (tokenParams.token === Token.CELO) {
          // Special handling for reserve transfer
          const reserve = await kit.contracts.getReserve()
          if (await reserve.isSpender(account)) {
            await reserve.transferGold(address, tokenAmount.toFixed()).sendAndWaitForReceipt()
            return
          }
        }
        await tokenWrapper.transfer(address, tokenAmount.toFixed()).sendAndWaitForReceipt()
        console.info(`Successfully fauceted ${tokenParams.token}`)
      }
    }
    // Ensure all faucets attempts are independent of failures and report failures.
    const failures = (
      await concurrentMap(
        Math.min(argv.tokenParams.length, 10),
        argv.tokenParams,
        async (tokenParams) => {
          return faucetToken(tokenParams)
            .then(() => null)
            .catch((err) => `Token ${tokenParams.token}: (${err})`)
        }
      )
    ).filter((x) => x != null)
    if (failures.length) {
      console.error(`Error(s) fauceting: \n${failures.join('\n')}`)
      return
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
