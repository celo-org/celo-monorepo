import { Address, CeloTransactionObject, CeloTxObject, toTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { MultiSig } from '../generated/MultiSig'
import {
  BaseWrapper,
  proxyCall,
  proxySend,
  stringIdentity,
  stringToSolidityBytes,
  tupleParser,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'

export interface TransactionData {
  destination: string
  value: BigNumber
  data: string
  executed: boolean
  confirmations: string[]
}

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
  async submitOrConfirmTransaction(
    destination: string,
    txObject: CeloTxObject<any>,
    value: string = '0'
  ) {
    const data = stringToSolidityBytes(txObject.encodeABI())
    const transactionCount = await this.contract.methods.getTransactionCount(true, true).call()
    let transactionId
    for (transactionId = Number(transactionCount) - 1; transactionId >= 0; transactionId--) {
      const transaction = await this.contract.methods.transactions(transactionId).call()
      if (
        transaction.data === data &&
        transaction.destination === destination &&
        transaction.value === value &&
        !transaction.executed
      ) {
        return toTransactionObject(
          this.kit.connection,
          this.contract.methods.confirmTransaction(transactionId)
        )
      }
    }
    return toTransactionObject(
      this.kit.connection,
      this.contract.methods.submitTransaction(destination, value, data)
    )
  }

  isowner: (owner: Address) => Promise<boolean> = proxyCall(this.contract.methods.isOwner)
  getOwners = proxyCall(this.contract.methods.getOwners)
  getRequired = proxyCall(this.contract.methods.required, undefined, valueToBigNumber)
  getInternalRequired = proxyCall(
    this.contract.methods.internalRequired,
    undefined,
    valueToBigNumber
  )
  getTransactionCount = proxyCall(this.contract.methods.transactionCount, undefined, valueToInt)
  replaceOwner: (owner: Address, newOwner: Address) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.replaceOwner,
    tupleParser(stringIdentity, stringIdentity)
  )

  async getTransaction(i: number): Promise<TransactionData> {
    const { destination, value, data, executed } = await this.contract.methods
      .transactions(i)
      .call()
    const confirmations = []
    for (const e of await this.getOwners()) {
      if (await this.contract.methods.confirmations(i, e).call()) {
        confirmations.push(e)
      }
    }
    return {
      destination,
      data,
      executed,
      confirmations,
      value: new BigNumber(value),
    }
  }

  async getTransactions(): Promise<TransactionData[]> {
    const txcount = await this.getTransactionCount()
    const res: TransactionData[] = []
    for (let i = 0; i < txcount; i++) {
      res.push(await this.getTransaction(i))
    }
    return res
  }
}
