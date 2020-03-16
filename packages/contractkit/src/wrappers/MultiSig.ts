import { TransactionObject } from 'web3-eth'
import { Address } from '../base'
import { MultiSig } from '../generated/MultiSig'
import { BaseWrapper, proxyCall, stringToBytes, toTransactionObject } from './BaseWrapper'

/**
 * Contract for handling multisig actions
 */
export class MultiSigWrapper extends BaseWrapper<MultiSig> {
  /**
   * Allows an owner to submit and confirm a transaction.
   * If an unexecuted transaction matching `txObject` exists on the multisig, adds a confirmation to that tx ID.
   * Otherwise, submits the `txObject` to the multisig and add confirmation.
   * @param index The index of the pending withdrawal to withdraw.
   */
  async submitOrConfirmTransaction(destination: string, txObject: TransactionObject<any>) {
    const data = stringToBytes(txObject.encodeABI())
    const transactionCount = await this.contract.methods.getTransactionCount(true, true).call()
    let transactionId
    for (transactionId = Number(transactionCount) - 1; transactionId >= 0; transactionId--) {
      const transaction = await this.contract.methods.transactions(transactionId).call()
      if (
        transaction.data === data &&
        transaction.destination === destination &&
        transaction.value === '0'
      ) {
        return toTransactionObject(
          this.kit,
          this.contract.methods.confirmTransaction(transactionId)
        )
      }
    }
    return toTransactionObject(
      this.kit,
      this.contract.methods.submitTransaction(destination, 0, data)
    )
  }

  isowner: (owner: Address) => Promise<boolean> = proxyCall(this.contract.methods.isOwner)
}
