import { concurrentMap } from '@celo/base'
import { generateKeys } from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from './context'

BigNumber.config({ EXPONENTIAL_AT: 1e9 })

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
  context.kit.addAccount(root.privateKey)

  const stableToken = await context.kit.contracts.getStableToken()

  const rootBalance = await stableToken.balanceOf(root.address)
  if (rootBalance.lte(value)) {
    logger.error({ rootBalance: rootBalance.toString() }, 'error funding test account')
    throw new Error(
      `Root account ${root.address}'s balance (${rootBalance.toPrecision(
        4
      )}) is not enough for transferring ${value.toPrecision(4)}`
    )
  }
  const receipt = await stableToken
    .transfer(recipient.address, value.toString())
    .sendAndWaitForReceipt({ from: root.address })

  logger.debug({ receipt }, 'funded test account')
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
    context.kit.addAccount(account.privateKey)

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
