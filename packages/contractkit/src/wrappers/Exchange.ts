import { Exchange } from 'src/generated/types/Exchange'
import { BaseWrapper } from 'src/wrappers/BaseWrapper'

export class ExchangeWrapper extends BaseWrapper<Exchange> {
  getBuyTokenAmount = this.proxyCall(this.contract.methods.getBuyTokenAmount)

  getSellTokenAmount = this.proxyCall(this.contract.methods.getSellTokenAmount)

  getBuyAndSellBuckets = this.proxyCallAndTransform(
    this.contract.methods.getBuyAndSellBuckets,
    (callRes) => [callRes[0], callRes[1]] as [string, string]
  )

  exchange = this.proxySend(this.contract.methods.exchange)
}
