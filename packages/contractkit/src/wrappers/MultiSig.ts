import { Address } from '../base'
import { MultiSig } from '../generated/types/MultiSig'
import { BaseWrapper, proxyCall, proxySend, stringToBytes } from './BaseWrapper'

export type SubmitTransactionsParams = Parameters<MultiSig['methods']['submitTransaction']>
export const submitTransactionsParams = (
  destination: Address,
  transaction: string
): SubmitTransactionsParams => {
  return [destination, 0, stringToBytes(transaction)]
}

/**
 * Contract for handling multisig actions
 */
export class MultiSigWrapper extends BaseWrapper<MultiSig> {
  /**
   * Allows an owner to submit and confirm a transaction.
   * @param index The index of the pending withdrawal to withdraw.
   */
  submitTransaction = proxySend(
    this.kit,
    this.contract.methods.submitTransaction,
    submitTransactionsParams
  )

  isowner: (owner: Address) => Promise<boolean> = proxyCall(this.contract.methods.isOwner)
}
