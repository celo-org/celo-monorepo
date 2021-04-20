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
  cEUR: 'StableTokenEUR' as CeloContract,
}

export const ExchangeToRegistryName: Record<string, CeloContract> = {
  cUSD: CeloContract.Exchange,
  cEUR: 'ExchangeEUR' as CeloContract,
}

export async function fundAccountWithcUSD(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber
) {
  await fundAccountWithStableToken(context, account, value, 'cUSD')
}

export async function fundAccountWithStableToken(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber,
  stableToken: string
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

  const stableTokenInstance = await initStableTokenFromRegistry(stableToken, context.kit)

  const rootBalance = await stableTokenInstance.balanceOf(root.address)
  if (rootBalance.lte(value)) {
    logger.error({ rootBalance: rootBalance.toString() }, 'error funding test account')
    throw new Error(
      `Root account ${root.address}'s ${stableToken} balance (${rootBalance.toPrecision(
        4
      )}) is not enough for transferring ${value.toPrecision(4)}`
    )
  }
  const receipt = await stableTokenInstance
    .transfer(recipient.address, value.toString())
    .sendAndWaitForReceipt({ from: root.address, feeCurrency: stableTokenInstance.address })

  logger.debug({ stabletoken: stableToken, receipt }, `funded test account with ${stableToken}`)
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

export async function clearAllFundsToRoot(context: EnvTestContext, stableTokensToClear: string[]) {
  const accounts = Array.from(
    new Array(Object.keys(TestAccounts).length / 2),
    (_val, index) => index
  )
  const root = await getKey(context.mnemonic, TestAccounts.Root)
  context.logger.debug({ account: root.address }, 'clear test fund accounts')
  const goldToken = await context.kit.contracts.getGoldToken()
  await concurrentMap(5, accounts, async (_val, index) => {
    if (index === 0) {
      return
    }
    const account = await getKey(context.mnemonic, index)
    context.kit.connection.addAccount(account.privateKey)

    const celoBalance = await goldToken.balanceOf(account.address)
    // Exchange and transfer tests move ~0.5, so setting the threshold slightly below
    const maxBalanceBeforeCollecting = ONE.times(0.4)
    if (celoBalance.gt(maxBalanceBeforeCollecting)) {
      await goldToken
        .transfer(
          root.address,
          celoBalance.times(0.99).integerValue(BigNumber.ROUND_DOWN).toString()
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
    for (const stableToken of stableTokensToClear) {
      const stableTokenInstance = await initStableTokenFromRegistry(stableToken, context.kit)
      const balance = await stableTokenInstance.balanceOf(account.address)
      if (balance.gt(maxBalanceBeforeCollecting)) {
        await stableTokenInstance
          .transfer(root.address, balance.times(0.99).integerValue(BigNumber.ROUND_DOWN).toString())
          .sendAndWaitForReceipt({
            feeCurrency: stableTokenInstance.address,
            from: account.address,
          })
        const balanceAfter = await stableTokenInstance.balanceOf(account.address)
        context.logger.debug(
          {
            index,
            stabletoken: stableToken,
            balanceBefore: balance.toString(),
            address: account.address,
            BalanceAfter: balanceAfter.toString(),
          },
          `cleared ${stableToken}`
        )
      }
    }
  })
}

// This function creates an stabletoken instance from a registry address and the StableToken ABI and wraps it with StableTokenWrapper.
// It is required for cEUR testing until cEUR stabletoken wrapper is included in ContractKit.
// Function is supposed to be deprecated as soon as cEUR stabletoken is wrapped.
export async function initStableTokenFromRegistry(stableToken: string, kit: ContractKit) {
  const stableTokenAddress = await kit.registry.addressFor(StableTokenToRegistryName[stableToken])
  const stableTokenContract = newStableToken(kit.web3, stableTokenAddress)
  return new StableTokenWrapper(kit, stableTokenContract)
}

// This function creates an exchange instance from a registry address and the Exchange ABI and wraps it with ExchangeWrapper.
// It is required for cEUR testing until cEUR exchange wrapper is included in ContractKit.
// Function is supposed to be deprecated as soon as cEUR exchange is wrapped.
export async function initExchangeFromRegistry(stableToken: string, kit: ContractKit) {
  const exchangeAddress = await kit.registry.addressFor(ExchangeToRegistryName[stableToken])
  const exchangeContract = newExchange(kit.web3, exchangeAddress)
  return new ExchangeWrapper(kit, exchangeContract)
}
