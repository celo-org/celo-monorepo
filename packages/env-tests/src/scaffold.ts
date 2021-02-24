import { concurrentMap } from '@celo/base'
import { CeloContract, ContractKit } from '@celo/contractkit'
import { newExchange } from '@celo/contractkit/lib/generated/Exchange'
import { newStableToken } from '@celo/contractkit/lib/generated/StableToken'
import { ExchangeWrapper } from '@celo/contractkit/lib/wrappers/Exchange'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { generateKeys } from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from './context'

BigNumber.config({ EXPONENTIAL_AT: 1e9 })

export const StableTokenToRegistryName: Record<string, CeloContract> = {
  cUSD: CeloContract.StableToken,
  cEUR: 'StableTokenEur' as CeloContract,
}

export const ExchangeToRegistryName: Record<string, CeloContract> = {
  cUSD: CeloContract.Exchange,
  cEUR: 'ExchangeEUR' as CeloContract,
}

export async function fundAccount(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber
) {
  const root = await getKey(context.mnemonic, TestAccounts.Root)
  const recipient = await getKey(context.mnemonic, account)
  const logger = context.logger.child({
    index: account,
    account: root.address,
    value: value.toString(),
    address: recipient.address,
  })
  context.kit.connection.addAccount(root.privateKey)

  for (const stableToken of context.stableTokensToTest) {
    let stableTokenInstance = await initStableTokenFromRegistry(stableToken, context.kit)

    const rootBalance = await stableTokenInstance.balanceOf(root.address)
    if (rootBalance.lte(value)) {
      logger.error({ rootBalance: rootBalance.toString() }, 'error funding test account')
      throw new Error(
        `Root account ${root.address}'s balance (${rootBalance.toPrecision(
          4
        )}) is not enough for transferring ${value.toPrecision(4)}`
      )
    }
    const receipt = await stableTokenInstance
      .transfer(recipient.address, value.toString())
      .sendAndWaitForReceipt({ from: root.address, feeCurrency: stableTokenInstance.address })

    logger.debug({ receipt }, `funded test account with ${stableToken}`)
  }
}

export async function getKey(mnemonic: string, account: TestAccounts) {
  const key = await generateKeys(mnemonic, undefined, 0, account)
  return { ...key, address: privateKeyToAddress(key.privateKey) }
}

export enum TestAccounts {
  Root,
  TransferFrom,
  TransferTo,
  Exchange,
  Oracle,
  GovernanceApprover,
  ReserveSpender,
  ReserveCustodian,
}

export const ONE = new BigNumber('1000000000000000000')

export async function clearAllFundsToRoot(context: EnvTestContext) {
  const accounts = Array.from(
    new Array(Object.keys(TestAccounts).length / 2),
    (_val, index) => index
  )
  const root = await getKey(context.mnemonic, TestAccounts.Root)
  context.logger.debug({ account: root.address }, 'clear test fund accounts')
  const stableToken = await context.kit.contracts.getStableToken()
  const goldToken = await context.kit.contracts.getGoldToken()
  await concurrentMap(5, accounts, async (_val, index) => {
    if (index === 0) {
      return
    }
    const account = await getKey(context.mnemonic, index)
    context.kit.connection.addAccount(account.privateKey)

    const celoBalance = await goldToken.balanceOf(account.address)
    if (celoBalance.gt(ONE)) {
      await goldToken
        .transfer(
          root.address,
          celoBalance
            .times(0.99)
            .integerValue(BigNumber.ROUND_DOWN)
            .toString()
        )
        .sendAndWaitForReceipt({ from: account.address, feeCurrency: undefined })
      context.logger.debug(
        {
          index,
          value: celoBalance.toString(),
          address: account.address,
        },
        'cleared CELO'
      )
    }

    const balance = await stableToken.balanceOf(account.address)
    if (balance.gt(ONE)) {
      await stableToken
        .transfer(
          root.address,
          balance
            .times(0.99)
            .integerValue(BigNumber.ROUND_DOWN)
            .toString()
        )
        .sendAndWaitForReceipt({ feeCurrency: stableToken.address, from: account.address })
      context.logger.debug(
        {
          index,
          value: balance.toString(),
          address: account.address,
        },
        'cleared cUSD'
      )
    }
  })
}

// This function creates as stabletoken instance from a registry address and the StableToken ABI and wraps it with StableTokenWrapper.
// It is required for cEUR testing until cEUR stabletoken wrapper is included in ContractKit.
// Function is supposed to be deprecated as soon as cEUR stabletoken is wrapped.
export async function initStableTokenFromRegistry(stableToken: string, kit: ContractKit) {
  let stableTokenAddress = await kit.registry.addressFor(StableTokenToRegistryName[stableToken])
  let stableTokenContract = newStableToken(kit.web3, stableTokenAddress)
  return new StableTokenWrapper(kit, stableTokenContract)
}

export async function initExchangeFromRegistry(stableToken: string, kit: ContractKit) {
  let exchangeAddress = await kit.registry.addressFor(ExchangeToRegistryName[stableToken])
  let exchangeContract = newExchange(kit.web3, exchangeAddress)
  return new ExchangeWrapper(kit, exchangeContract)
}
