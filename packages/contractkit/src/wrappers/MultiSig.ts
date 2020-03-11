import { TransactionObject } from 'web3/eth/types'
import { Address } from '../base'
import { MultiSig } from '../generated/types/MultiSig'
import { BaseWrapper, proxyCall, stringToBytes, toTransactionObject } from './BaseWrapper'

/**
 * Contract for handling multisig actions
 */
export class MultiSigWrapper extends BaseWrapper<MultiSig> {
  /**
   * Allows an owner to submit and confirm a transaction.
   * @param index The index of the pending withdrawal to withdraw.
   */
  async submitOrConfirmTransaction(destination: string, txObject: TransactionObject<any>) {
    // async submitOrConfirmTransaction(destination: string, transaction: string) {
    const data = stringToBytes(txObject.encodeABI())
    // const data = stringToBytes(transaction)
    const transactionCount = await this.contract.methods.getTransactionCount(true, true).call()
    let transactionId
    for (transactionId = 0; transactionId < Number(transactionCount); transactionId++) {
      const transaction = await this.contract.methods.transactions(transactionId).call()
      if (transaction.data === data && transaction.destination === destination) {
        break
      }
    }
    if (transactionId < Number(transactionCount)) {
      return toTransactionObject(this.kit, this.contract.methods.confirmTransaction(transactionId))
    }
    return toTransactionObject(
      this.kit,
      this.contract.methods.submitTransaction(destination, 0, data)
    )
  }

  isowner: (owner: Address) => Promise<boolean> = proxyCall(this.contract.methods.isOwner)
}
