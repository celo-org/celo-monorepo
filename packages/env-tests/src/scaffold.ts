import { concurrentMap } from '@celo/base'
import { generateKeys } from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Context } from './context'

export async function fundAccount(context: Context, account: TestAccounts, value: BigNumber) {
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
    logger.error('error funding test account', { rootBalance: rootBalance.toString() })
    throw new Error(
      `Root account ${root.address}'s balance (${rootBalance.toPrecision(
        4
      )}) is not enough for transferring ${value.toPrecision(4)}`
    )
  }
  const receipt = await stableToken
    .transfer(recipient.address, value.toString())
    .sendAndWaitForReceipt({ from: root.address })

  logger.debug('funded test account', { receipt })
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
}

export const ONE = new BigNumber('1000000000000000000')

export async function clearAllFundsToRoot(context: Context) {
  const accounts = Array.from(
    new Array(Object.keys(TestAccounts).length / 2),
    (_val, index) => index
  )
  const root = await getKey(context.mnemonic, TestAccounts.Root)
  context.logger.debug('clear test fund accounts', { account: root.address })
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
      context.logger.debug('cleared CELO', {
        index,
        value: celoBalance.toString(),
        address: account.address,
      })
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
      context.logger.debug('cleared cUSD', {
        index,
        value: balance.toString(),
        address: account.address,
      })
    }
  })
}
