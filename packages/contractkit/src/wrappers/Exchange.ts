import BigNumber from 'bignumber.js'
import { Exchange } from '../generated/types/Exchange'
import { BaseWrapper, proxyCall, proxySend, toBigNumber } from './BaseWrapper'

export class ExchangeWrapper extends BaseWrapper<Exchange> {
  getBuyTokenAmount = proxyCall(this.contract.methods.getBuyTokenAmount, undefined, toBigNumber)

  getSellTokenAmount = proxyCall(this.contract.methods.getSellTokenAmount, undefined, toBigNumber)

  getBuyAndSellBuckets = proxyCall(
    this.contract.methods.getBuyAndSellBuckets,
    undefined,
    (callRes: { 0: string; 1: string }) =>
      [toBigNumber(callRes[0]), toBigNumber(callRes[1])] as [BigNumber, BigNumber]
  )

  exchange = proxySend(this.kit, this.contract.methods.exchange)
}
