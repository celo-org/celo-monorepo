import { Address, CeloTransactionObject, CeloTxObject, toTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { MultiSig } from '@celo/abis/types/web3/MultiSig'
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
export interface TransactionDataWithOutConfirmations {
  destination: string
  value: BigNumber
  data: string
  executed: boolean
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
  async submitOrConfirmTransaction(destination: string, txObject: CeloTxObject<any>, value = '0') {
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
          this.connection,
          this.contract.methods.confirmTransaction(transactionId)
        )
      }
    }
    return toTransactionObject(
      this.connection,
      this.contract.methods.submitTransaction(destination, value, data)
    )
  }

  async confirmTransaction(transactionId: number) {
    return toTransactionObject(
      this.connection,
      this.contract.methods.confirmTransaction(transactionId)
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
  totalTransactionCount = proxyCall(this.contract.methods.transactionCount, undefined, valueToInt)
  getTransactionCount = proxyCall(this.contract.methods.getTransactionCount, undefined, valueToInt)
  replaceOwner: (owner: Address, newOwner: Address) => CeloTransactionObject<void> = proxySend(
    this.connection,
    this.contract.methods.replaceOwner,
    tupleParser(stringIdentity, stringIdentity)
  )

  async getTransactionDataByContent(
    destination: string,
    txo: CeloTxObject<any>,
    value: BigNumber.Value = 0
  ) {
    const data = stringToSolidityBytes(txo.encodeABI())
    const transactionCount = await this.getTransactionCount(true, true)
    const transactionsOrEmpties = await Promise.all(
      Array(transactionCount)
        .fill(0)
        .map(async (_, index) => {
          const tx = await this.getTransaction(index, false)
          if (tx.data === data && tx.destination === destination && tx.value.isEqualTo(value)) {
            return { index, ...tx }
          }
          return null
        })
    )
    const wantedTransaction = transactionsOrEmpties.find((tx) => tx !== null)
    if (!wantedTransaction) {
      return
    }
    const confirmations = await this.getConfirmations(wantedTransaction.index)
    return {
      ...wantedTransaction,
      confirmations,
    }
  }
  async getTransaction(i: number): Promise<TransactionData>
  async getTransaction(
    i: number,
    includeConfirmations: false
  ): Promise<TransactionDataWithOutConfirmations>
  async getTransaction(i: number, includeConfirmations = true) {
    const { destination, value, data, executed } = await this.contract.methods
      .transactions(i)
      .call()
    if (!includeConfirmations) {
      return {
        destination,
        data,
        executed,
        value: new BigNumber(value),
      }
    }

    const confirmations = await this.getConfirmations(i)
    return {
      confirmations,
      destination,
      data,
      executed,
      value: new BigNumber(value),
    }
  }

  /*
   * Returns array of signer addresses which have confirmed a transaction
   * when given the index of that transaction.
   */
  async getConfirmations(txId: number) {
    const owners = await this.getOwners()
    const confirmationsOrEmpties = await Promise.all(
      owners.map(async (owner) => {
        const confirmation = await this.contract.methods.confirmations(txId, owner).call()
        if (confirmation) {
          return owner
        } else {
          return null
        }
      })
    )
    const confirmations = confirmationsOrEmpties.filter((c) => c !== null) as string[]
    return confirmations
  }

  async getTransactions(): Promise<TransactionData[]> {
    const txcount = await this.totalTransactionCount()
    const res: TransactionData[] = []
    for (let i = 0; i < txcount; i++) {
      res.push(await this.getTransaction(i))
    }
    return res
  }
}

export type MultiSigWrapperType = MultiSigWrapper
