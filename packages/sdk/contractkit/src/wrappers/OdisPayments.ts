import { OdisPayments } from '../generated/OdisPayments'
import { BaseWrapper, proxyCall, proxySend, valueToBigNumber } from './BaseWrapper'

export class OdisPaymentsWrapper extends BaseWrapper<OdisPayments> {
  totalPaidCUSD = proxyCall(this.contract.methods.totalPaidCUSD, undefined, valueToBigNumber)
  payInCUSD = proxySend(this.connection, this.contract.methods.payInCUSD)
}

export type OdisPaymentsWrapperType = OdisPaymentsWrapper
