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

  transfer = proxySend(this.connection, this.contract.methods.transfer)

  withdraw = proxySend(this.connection, this.contract.methods.withdraw)

  revoke = proxySend(this.connection, this.contract.methods.revoke)
}

export type EscrowWrapperType = EscrowWrapper
