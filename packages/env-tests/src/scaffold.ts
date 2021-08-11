import { concurrentMap } from '@celo/base'
import { CeloTokenType, StableToken, Token } from '@celo/contractkit'
import { generateKeys } from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from './context'

BigNumber.config({ EXPONENTIAL_AT: 1e9 })
const ONE_TOKEN = new BigNumber(10).pow(18)

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
  const transfer = (to: string, amount: BigNumber, fromAddress: string) =>
    tokenWrapper.transfer(to, amount.toString()).sendAndWaitForReceipt({
      from: fromAddress,
      feeCurrency: token === Token.CELO ? undefined : tokenWrapper.address,
    })

  const validator0 = await getValidatorKey(context.mnemonic, 0)
  const root = await getKey(context.mnemonic, TestAccounts.Root)
  context.kit.connection.addAccount(validator0.privateKey)
  context.kit.connection.addAccount(root.privateKey)

  const recipient = await getKey(context.mnemonic, account)
  const logger = context.logger.child({
    token,
    index: account,
    validator0: validator0.address,
    root: root.address,
    value: value.toString(),
    recipient: recipient.address,
  })

  let rootAmountToFund = value
  const rootBalance = await tokenWrapper.balanceOf(root.address)
  // Make sure to leave Root at least 1 token, this is useful for paying TX fees.
  const minRootBalance = ONE_TOKEN
  // Check if Root has enough to fund the recipient.
  if (rootBalance.lte(value.plus(minRootBalance))) {
    // If not, check if validator 0 can supply the rest of the balance.
    const validator0Balance = await tokenWrapper.balanceOf(validator0.address)
    // Calculate the amount for validator 0 to fund, ensuring that root retains
    // its minimum balance.
    const amountNeededFromValidator0 = value.plus(minRootBalance).minus(rootBalance)
    if (validator0Balance.isGreaterThanOrEqualTo(amountNeededFromValidator0)) {
      // Have validator 0 send the amount needed to the recipient
      const validator0FundingReceipt = await transfer(
        recipient.address,
        amountNeededFromValidator0,
        validator0.address
      )
      logger.debug(
        {
          validator0FundingReceipt,
          amountNeededFromValidator0,
          rootAmountToFund,
        },
        'Validator 0 funded recipient'
      )
      rootAmountToFund = rootAmountToFund.minus(amountNeededFromValidator0)
    } else {
      logger.error({ fromBalance: rootBalance.toString() }, 'error funding test account')
      throw new Error(
        `Root account ${root.address}'s balance (${rootBalance.toPrecision(4)}) and validator 0 ${
          validator0.address
        }'s of ${validator0Balance.toPrecision(
          4
        )} ${token} is not enough for transferring ${value.toPrecision(4)}`
      )
    }
  }
  if (rootAmountToFund.isGreaterThan(0)) {
    const receipt = await transfer(recipient.address, rootAmountToFund, root.address)
    logger.debug({ rootFundingReceipt: receipt, rootAmountToFund }, `Root funded recipient`)
  }
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

export async function clearAllFundsToOriginalAddress(
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
  await concurrentMap(1, accounts, async (_val, index) => {
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
