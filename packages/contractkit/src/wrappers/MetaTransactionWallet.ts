import { ensureLeading0x, trimLeading0x } from '@celo/base'
import { Signature } from '@celo/base/lib/signatureUtils'
import { EIP712TypedData, generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import { HttpProvider } from 'web3-core'
import { Address } from '../base'
import { MetaTransactionWallet } from '../generated/MetaTransactionWallet'
import {
  BaseWrapper,
  CeloTransactionObject,
  numericToHex,
  proxyCall,
  proxySend,
  stringIdentity,
  toTransactionObject,
  valueToInt,
} from './BaseWrapper'

export interface MTWTransaction {
  destination: Address
  value?: BigNumber.Value
  data?: string
}

export interface MTWMetaTransaction extends MTWTransaction {
  nonce: number
}

export interface MTWSignedMetaTransaction extends MTWTransaction {
  nonce: number
  signature: Signature
}

/**
 * Calls that wraps the MetaTransactionWallet
 */
export class MetaTransactionWalletWrapper extends BaseWrapper<MetaTransactionWallet> {
  /**
   * Execute a transaction originating from the MTW
   * Reverts if the caller is not a signer
   * @param tx a MTWTransaction
   */
  executeTransaction(tx: MTWTransaction) {
    return toTransactionObject(
      this.kit,
      this.contract.methods.executeTransaction(
        tx.destination,
        numericToHex(tx.value),
        tx.data || '0x'
      )
    )
  }

  /**
   * Execute a batch of transactions originating from the MTW
   * Reverts if the caller is not a signer
   * @param txs An array of MTWTransactions
   */
  executeTransactions(txs: MTWTransaction[]) {
    return toTransactionObject(this.kit, this.buildExecuteTransactionsTx(txs))
  }

  /**
   * Builds the TransactionObject for executeTransactions
   * Reverts if the caller is not a signer
   * @param txs An array of MTWTransactions
   */
  buildExecuteTransactionsTx(txs: MTWTransaction[]) {
    const destinations = txs.map((tx) => tx.destination)
    const values = txs.map((tx) => numericToHex(tx.value))
    const callData = ensureLeading0x(txs.map((tx) => trimLeading0x(tx.data || '0x')).join(''))
    const callDataLengths = txs.map((tx) => trimLeading0x(tx.data || '0x').length / 2)

    return this.contract.methods.executeTransactions(
      destinations,
      values,
      callData,
      callDataLengths
    )
  }

  /**
   * Builds a MetaTransaction that wraps a series of Transactions
   * Reverts if the caller is not a signer
   * @param txs An array of MTWTransactions
   * @returns MTWMetaTransaction
   */
  buildExecuteTransactionsWrapperTx(txs: MTWTransaction[]): MTWTransaction {
    const executeTransactionsTx = this.buildExecuteTransactionsTx(txs)

    return {
      destination: this.address,
      value: new BigNumber(0),
      data: executeTransactionsTx.encodeABI(),
    }
  }

  /**
   * Execute a signed meta transaction
   * Reverts if meta-tx signer is not a signer for the wallet
   * @param mtx a MTWSignedMetaTransaction
   */
  executeMetaTransaction(mtx: MTWSignedMetaTransaction) {
    return toTransactionObject(
      this.kit,
      this.contract.methods.executeMetaTransaction(
        mtx.destination,
        numericToHex(mtx.value),
        mtx.data || '0x',
        mtx.signature.v,
        mtx.signature.r,
        mtx.signature.s
      )
    )
  }

  /**
   * Signs a meta transaction as EIP712 typed data
   * @param mtx a MTWTransaction
   * @returns smtx a MTWSignedMetaTransaction
   */
  async signMetaTransaction(
    signer: Address,
    tx: MTWTransaction,
    nonce?: number
  ): Promise<MTWSignedMetaTransaction> {
    const metaTx: MTWMetaTransaction = {
      ...tx,
      nonce: nonce === undefined ? await this.nonce() : nonce,
    }

    const typedData = await this.getMetaTransactionTypedData(metaTx)
    // TODO: This should be cached by the CeloProvider and executed through the wallets.
    //       But I think the GethNativeBridgeWallet currently doesn't support this, it's
    //       in the works.
    const signature = await new Promise<string>((resolve, reject) => {
      ;(this.kit.web3.currentProvider as Pick<HttpProvider, 'send'>).send(
        {
          jsonrpc: '2.0',
          method: 'eth_signTypedData',
          params: [signer, typedData],
        },
        (error, resp) => {
          if (error) {
            reject(error)
          } else if (resp) {
            resolve(resp.result as string)
          } else {
            reject(new Error('empty-response'))
          }
        }
      )
    })

    const messageHash = ensureLeading0x(generateTypedDataHash(typedData).toString('hex'))
    const parsedSignature = parseSignatureWithoutPrefix(messageHash, signature, signer)
    return {
      ...metaTx,
      signature: parsedSignature,
    }
  }

  /**
   * Get MetaTransaction Typed Data
   * @param mtx MTWMetaTransaction
   * @returns EIP712TypedData
   */
  async getMetaTransactionTypedData(mtx: MTWMetaTransaction) {
    return buildMetaTxTypedData(this.address, mtx, await this._getChainId())
  }

  _spreadMetaTx = (mtx: MTWMetaTransaction): [string, string, string, number] => [
    mtx.destination,
    numericToHex(mtx.value),
    mtx.data || '0x',
    mtx.nonce,
  ]

  _spreadSignedMetaTx = (
    mtx: MTWSignedMetaTransaction
  ): [string, string, string, number, number, string, string] => [
    mtx.destination,
    numericToHex(mtx.value),
    mtx.data || '0x',
    mtx.nonce,
    mtx.signature.v,
    mtx.signature.r,
    mtx.signature.s,
  ]

  getMetaTransactionDigest = proxyCall(
    this.contract.methods.getMetaTransactionDigest,
    this._spreadMetaTx,
    stringIdentity
  )

  getMetaTransactionStructHash = proxyCall(
    this.contract.methods.getMetaTransactionStructHash,
    this._spreadMetaTx,
    stringIdentity
  )

  getMetaTransactionSigner = proxyCall(
    this.contract.methods.getMetaTransactionSigner,
    this._spreadSignedMetaTx,
    stringIdentity
  )

  eip712DomainSeparator = proxyCall(this.contract.methods.eip712DomainSeparator)
  isOwner = proxyCall(this.contract.methods.isOwner)
  nonce = proxyCall(this.contract.methods.nonce, undefined, valueToInt)
  signer = proxyCall(this.contract.methods.signer, undefined, stringIdentity)

  transferOwnership: (newOwner: Address) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.transferOwnership
  )

  setSigner: (newSigner: Address) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.setSigner
  )

  setEip712DomainSeparator: () => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.setEip712DomainSeparator
  )

  /**
   * Get an cache the chain ID -- assume it's static for a kit instance
   * @returns chainId
   */
  _chainId?: number = undefined
  async _getChainId() {
    if (this._chainId === undefined) {
      this._chainId = await this.kit.web3.eth.net.getId()
    }
    return this._chainId
  }
}

export const buildMetaTxTypedData = (
  walletAddress: Address,
  tx: MTWMetaTransaction,
  chainId: number
): EIP712TypedData => {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ExecuteMetaTransaction: [
        { name: 'destination', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    primaryType: 'ExecuteMetaTransaction',
    domain: {
      name: 'MetaTransactionWallet',
      version: '1.1',
      chainId,
      verifyingContract: walletAddress,
    },
    message: tx
      ? {
          destination: tx.destination,
          value: numericToHex(tx.value),
          data: tx.data || '0x',
          nonce: tx.nonce,
        }
      : {},
  }
}
