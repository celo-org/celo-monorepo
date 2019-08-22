import BigNumber from 'bignumber.js'
import { Exchange } from '../generated/types/Exchange'
import { BaseWrapper, toBigNumber } from './BaseWrapper'

export class ExchangeWrapper extends BaseWrapper<Exchange> {
  getBuyTokenAmount = this.proxyCallAndTransform(
    this.contract.methods.getBuyTokenAmount,
    toBigNumber
  )

  getSellTokenAmount = this.proxyCallAndTransform(
    this.contract.methods.getSellTokenAmount,
    toBigNumber
  )

  getBuyAndSellBuckets = this.proxyCallAndTransform(
    this.contract.methods.getBuyAndSellBuckets,
    (callRes) => [toBigNumber(callRes[0]), toBigNumber(callRes[1])] as [BigNumber, BigNumber]
  )

  exchange = this.proxySend(this.contract.methods.exchange)
}
