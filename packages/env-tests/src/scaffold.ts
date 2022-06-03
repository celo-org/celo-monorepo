import { concurrentMap } from '@celo/base'
import { CeloTokenType, StableToken, Token } from '@celo/contractkit'
import { generateKeys } from '@celo/cryptographic-utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from './context'

BigNumber.config({ EXPONENTIAL_AT: 1e9 })

interface KeyInfo {
  address: string
  privateKey: string
  publicKey: string
}

export async function fundAccountWithCELO(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber
) {
  return fundAccount(context, account, value, Token.CELO)
}

export async function fundAccountWithcUSD(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber
) {
  await fundAccountWithStableToken(context, account, value, StableToken.cUSD)
}

export async function fundAccountWithStableToken(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber,
  stableToken: StableToken
) {
  return fundAccount(context, account, value, stableToken)
}

async function fundAccount(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber,
  token: CeloTokenType
) {
  const tokenWrapper = await context.kit.celoTokens.getWrapper(token)

  const root = await getKey(context.mnemonic, TestAccounts.Root)
  context.kit.connection.addAccount(root.privateKey)

  const recipient = await getKey(context.mnemonic, account)
  const logger = context.logger.child({
    token,
    index: account,
    root: root.address,
    value: value.toString(),
    recipient: recipient.address,
  })

  const rootBalance = await tokenWrapper.balanceOf(root.address)
  if (rootBalance.lte(value)) {
    logger.error({ rootBalance: rootBalance.toString() }, 'Error funding test account')
    throw new Error(
      `Root account ${root.address}'s ${token} balance (${rootBalance.toPrecision(
        4
      )}) is not enough for transferring ${value.toPrecision(4)}`
    )
  }
  const receipt = await tokenWrapper
    .transfer(recipient.address, value.toString())
    .sendAndWaitForReceipt({
      from: root.address,
      feeCurrency: token === Token.CELO ? undefined : tokenWrapper.address,
    })
  logger.info({ rootFundingReceipt: receipt, value }, `Root funded recipient`)
}

export async function getValidatorKey(mnemonic: string, index: number): Promise<KeyInfo> {
  return getKey(mnemonic, index, '')
}

export async function getKey(
  mnemonic: string,
  account: TestAccounts,
  derivationPath?: string
): Promise<KeyInfo> {
  const key = await generateKeys(mnemonic, undefined, 0, account, undefined, derivationPath)
  return { ...key, address: privateKeyToAddress(key.privateKey) }
}

export enum TestAccounts {
  Root,
  GrandaMentoExchanger,
  TransferFrom,
  TransferTo,
  Exchange,
  Oracle,
  GovernanceApprover,
  ReserveSpender,
  ReserveCustodian,
}

export const ONE = new BigNumber('1000000000000000000')

export async function clearAllFundsToRoot(
  context: EnvTestContext,
  stableTokensToClear: StableToken[]
) {
  const accounts = Array.from(
    new Array(Object.keys(TestAccounts).length / 2),
    (_val, index) => index
  )
  // Refund all to root
  const root = await getKey(context.mnemonic, TestAccounts.Root)
  context.logger.debug({ root: root.address }, 'Clearing funds of test accounts back to root')
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
          celoBalance
            .minus(maxBalanceBeforeCollecting)
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
    for (const stableToken of stableTokensToClear) {
      const stableTokenInstance = await context.kit.celoTokens.getWrapper(stableToken)
      const balance = await stableTokenInstance.balanceOf(account.address)
      if (balance.gt(maxBalanceBeforeCollecting)) {
        await stableTokenInstance
          .transfer(
            root.address,
            balance.minus(maxBalanceBeforeCollecting).integerValue(BigNumber.ROUND_DOWN).toString()
          )
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

export function parseStableTokensList(stableTokenList: string): StableToken[] {
  const stableTokenStrs = stableTokenList.split(',')
  const validStableTokens = Object.values(StableToken)

  for (const stableTokenStr of stableTokenStrs) {
    if (!validStableTokens.includes(stableTokenStr as StableToken)) {
      throw Error(`String ${stableTokenStr} not a valid StableToken`)
    }
  }
  return stableTokenStrs as StableToken[]
}
