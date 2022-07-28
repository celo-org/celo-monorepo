import { OdisBalance } from '../generated/OdisBalance'
import { BaseWrapper, proxyCall, proxySend } from './BaseWrapper'

export class OdisBalanceWrapper extends BaseWrapper<OdisBalance> {
  totalPaidCUSD = proxyCall(this.contract.methods.totalPaidCUSD)
  payInCUSD = proxySend(this.connection, this.contract.methods.payInCUSD)
}

export type OdisBalanceWrapperType = OdisBalanceWrapper
