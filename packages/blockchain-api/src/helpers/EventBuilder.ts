import { BigNumber } from 'bignumber.js'
import { BlockscoutCeloTransfer } from '../blockscout'
import { CGLD, CUSD } from '../currencyConversion/consts'
import { EventTypes, Fee as FormattedFee, MoneyAmount } from '../schema'
import { Fee, Transaction } from '../transaction/Transaction'
import { WEI_PER_GOLD } from '../utils'

export class EventBuilder {
  static transferEvent(
    transaction: Transaction,
    transfer: BlockscoutCeloTransfer,
    eventType: string,
    address: string,
    account?: string,
    fees?: Fee[]
  ) {
    const hash = transaction.transactionHash
    const block = transaction.blockNumber
    const timestamp = transaction.timestamp
    const comment = transaction.comment

    const isOutgoingTransaction = fees !== undefined && fees.length > 0

    return {
      type: eventType,
      timestamp,
      block,
      comment,
      hash,
      address,
      account: account ? account : address,
      amount: {
        // Signed amount relative to the account currency
        value: new BigNumber(transfer.value)
          .multipliedBy(isOutgoingTransaction ? -1 : 1)
          .dividedBy(WEI_PER_GOLD)
          .toString(),
        currencyCode: transfer.token,
        timestamp,
      },
      ...(fees && { fees: EventBuilder.formatFees(fees, transaction.timestamp) }),
    }
  }

  static exchangeEvent(
    transaction: Transaction,
    inTransfer: BlockscoutCeloTransfer,
    outTransfer: BlockscoutCeloTransfer,
    token: string,
    fees?: Fee[]
  ) {
    const hash = transaction.transactionHash
    const block = transaction.blockNumber
    const timestamp = transaction.timestamp

    // Find the transfer related to the queried token
    const tokenTransfer = [inTransfer, outTransfer].find((event) => event!.token === token)
    if (!tokenTransfer) {
      return undefined
    }

    const impliedExchangeRates: MoneyAmount['impliedExchangeRates'] = {}
    if (inTransfer!.token === CGLD && outTransfer!.token === CUSD) {
      impliedExchangeRates['cGLD/cUSD'] = new BigNumber(outTransfer!.value).dividedBy(
        inTransfer!.value
      )
    }
    if (outTransfer!.token === CGLD && inTransfer!.token === CUSD) {
      impliedExchangeRates['cGLD/cUSD'] = new BigNumber(inTransfer!.value).dividedBy(
        outTransfer!.value
      )
    }

    return {
      type: EventTypes.EXCHANGE,
      timestamp,
      block,
      hash,
      amount: {
        // Signed amount relative to the account currency
        value: new BigNumber(tokenTransfer!.value)
          .multipliedBy(tokenTransfer === inTransfer ? -1 : 1)
          .dividedBy(WEI_PER_GOLD)
          .toString(),
        currencyCode: tokenTransfer!.token,
        timestamp,
        impliedExchangeRates,
      },
      makerAmount: {
        value: new BigNumber(inTransfer!.value).dividedBy(WEI_PER_GOLD).toString(),
        currencyCode: inTransfer!.token,
        timestamp,
        impliedExchangeRates,
      },
      takerAmount: {
        value: new BigNumber(outTransfer!.value).dividedBy(WEI_PER_GOLD).toString(),
        currencyCode: outTransfer!.token,
        timestamp,
        impliedExchangeRates,
      },
      ...(fees && { fees: EventBuilder.formatFees(fees, transaction.timestamp) }),
    }
  }

  static formatFees(fees: Fee[], timestamp: number): FormattedFee[] {
    return fees.map((fee) => ({
      type: fee.type,
      amount: {
        currencyCode: fee.currencyCode,
        timestamp,
        value: fee.value.dividedBy(WEI_PER_GOLD).toFixed(),
      },
    }))
  }
}
