import { Escrow } from '../generated/Escrow'
import { BaseWrapper, proxyCall, proxySend } from './BaseWrapper'

/**
 * Contract for handling reserve for stable currencies
 */
export class EscrowWrapper extends BaseWrapper<Escrow> {
  escrowedPayments = proxyCall(this.contract.methods.escrowedPayments)

  receivedPaymentIds = proxyCall(this.contract.methods.receivedPaymentIds)

  sentPaymentIds = proxyCall(this.contract.methods.sentPaymentIds)

  getReceivedPaymentIds = proxyCall(this.contract.methods.getReceivedPaymentIds)

  getSentPaymentIds = proxyCall(this.contract.methods.getSentPaymentIds)

  transfer = proxySend(this.kit, this.contract.methods.transfer)

  withdraw = proxySend(this.kit, this.contract.methods.withdraw)

  revoke = proxySend(this.kit, this.contract.methods.revoke)
}
