import { OdisBalance } from '../generated/OdisBalance'
import { BaseWrapper, proxyCall, proxySend, valueToBigNumber } from './BaseWrapper'

export class OdisBalanceWrapper extends BaseWrapper<OdisBalance> {
  totalPaidCUSD = proxyCall(this.contract.methods.totalPaidCUSD, undefined, valueToBigNumber)
  payInCUSD = proxySend(this.connection, this.contract.methods.payInCUSD)
}

export type OdisBalanceWrapperType = OdisBalanceWrapper
