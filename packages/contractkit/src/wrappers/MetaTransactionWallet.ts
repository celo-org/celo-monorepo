import { ensureLeading0x, trimLeading0x } from '@celo/base'
import { Signature } from '@celo/base/lib/signatureUtils'
import { EIP712TypedData, generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import { HttpProvider } from 'web3-core'
import { TransactionObject } from 'web3-eth'
import { Address } from '../base'
import { MetaTransactionWallet } from '../generated/MetaTransactionWallet'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  stringIdentity,
  toTransactionObject,
  valueToInt,
  valueToString,
} from './BaseWrapper'

export interface TransactionObjectWithValue<T> {
  txo: TransactionObject<T>
  value: BigNumber.Value
}

export interface RawTransaction {
  destination: string
  value: string
  data: string
}

export type TransactionInput<T> =
  | TransactionObject<T>
  | TransactionObjectWithValue<T>
  | RawTransaction

/**
 * Class that wraps the MetaTransactionWallet
 */
export class MetaTransactionWalletWrapper extends BaseWrapper<MetaTransactionWallet> {
  /**
   * Execute a transaction originating from the MTW
   * Reverts if the caller is not a signer
   * @param tx a MTWTransaction
   */
  public executeTransaction(tx: TransactionInput<any>): CeloTransactionObject<string> {
    const rawTx = this.toRawTransaction(tx)
    return toTransactionObject(
      this.kit,
      this.contract.methods.executeTransaction(rawTx.destination, rawTx.value, rawTx.data)
    )
  }

  /**
   * Execute a batch of transactions originating from the MTW
   * Reverts if the caller is not a signer
   * @param txs An array of MTWTransactions
   */
  public executeTransactions(txs: Array<TransactionInput<any>>): CeloTransactionObject<void> {
    const rawTxs: RawTransaction[] = txs.map(this.toRawTransaction)
    const destinations = rawTxs.map((rtx) => rtx.destination)
    const values = rawTxs.map((rtx) => rtx.value)
    const callData = ensureLeading0x(rawTxs.map((rtx) => trimLeading0x(rtx.data)).join(''))
    const callDataLengths = rawTxs.map((rtx) => trimLeading0x(rtx.data).length / 2)

    return toTransactionObject(
      this.kit,
      this.contract.methods.executeTransactions(destinations, values, callData, callDataLengths)
    )
  }

  /**
   * Execute a signed meta transaction
   * Reverts if meta-tx signer is not a signer for the wallet
   * @param mtx a MTWSignedMetaTransaction
   */
  public executeMetaTransaction(
    tx: TransactionInput<any>,
    signature: Signature
  ): CeloTransactionObject<string> {
    const rawTx = this.toRawTransaction(tx)

    return toTransactionObject(
      this.kit,
      this.contract.methods.executeMetaTransaction(
        rawTx.destination,
        rawTx.value,
        rawTx.data,
        signature.v,
        signature.r,
        signature.s
      )
    )
  }

  /**
   * Signs a meta transaction as EIP712 typed data
   * @param tx a TransactionWrapper
   * @param nonce Optional -- will query contract state if not passed
   * @returns signature a Signature
   */
  async signMetaTransaction(tx: TransactionInput<any>, nonce?: number): Promise<Signature> {
    if (nonce === undefined) {
      nonce = await this.nonce()
    }
    const typedData = buildMetaTxTypedData(
      this.address,
      this.toRawTransaction(tx),
      nonce,
      await this.chainId()
    )
    // TODO: This should be cached by the CeloProvider and executed through the wallets.
    //       But I think the GethNativeBridgeWallet currently doesn't support this, it's
    //       in the works.
    const signer = await this.signer()
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
    return parseSignatureWithoutPrefix(messageHash, signature, signer)
  }

  /**
   * Execute a signed meta transaction
   * Reverts if meta-tx signer is not a signer for the wallet
   * @param mtx a MTWSignedMetaTransaction
   */
  public async signAndExecuteMetaTransaction(
    tx: TransactionInput<any>
  ): Promise<CeloTransactionObject<string>> {
    const signature = await this.signMetaTransaction(tx)
    return this.executeMetaTransaction(tx, signature)
  }

  private getMetaTransactionDigestParams = (
    tx: TransactionInput<any>,
    nonce: number
  ): [string, string, string, number] => {
    const rawTx = this.toRawTransaction(tx)
    return [rawTx.destination, rawTx.value, rawTx.data, nonce]
  }

  getMetaTransactionDigest = proxyCall(
    this.contract.methods.getMetaTransactionDigest,
    this.getMetaTransactionDigestParams,
    stringIdentity
  )

  private getMetaTransactionSignerParams = (
    tx: TransactionInput<any>,
    nonce: number,
    signature: Signature
  ): [string, string, string, number, number, string, string] => {
    const rawTx = this.toRawTransaction(tx)
    return [
      rawTx.destination,
      rawTx.value,
      rawTx.data,
      nonce,
      signature.v,
      signature.r,
      signature.s,
    ]
  }
  getMetaTransactionSigner = proxyCall(
    this.contract.methods.getMetaTransactionSigner,
    this.getMetaTransactionSignerParams,
    stringIdentity
  )

  eip712DomainSeparator = proxyCall(this.contract.methods.eip712DomainSeparator)
  isOwner = proxyCall(this.contract.methods.isOwner)
  nonce = proxyCall(this.contract.methods.nonce, undefined, valueToInt)
  private getSigner = proxyCall(this.contract.methods.signer, undefined, stringIdentity)

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
  _chainId?: number
  private async chainId(): Promise<number> {
    if (this._chainId === undefined) {
      this._chainId = await this.kit.web3.eth.net.getId()
    }
    return this._chainId
  }

  /**
   * Get an cache the signer - it should be static for a Wallet instance
   * @returns signer
   */
  _signer?: Address
  public async signer() {
    if (this._signer === undefined) {
      this._signer = await this.getSigner()
    }
    return this._signer
  }

  /**
   * Turns any possible way to pass in a tranasction into the raw values
   * that are actually required. This is used both internally to normalize
   * ways in which transactions are passed in but also public in order
   * for one instance of ContractKit to serialize a meta transaction to
   * send over the wire and be consumed somewhere else.
   * @param tx TransactionInput<any> union of all the ways we expect transactions
   * @returns a RawTransactions that's serializable
   */
  public toRawTransaction(tx: TransactionInput<any>): RawTransaction {
    if ('destination' in tx) {
      return tx
    } else if ('value' in tx) {
      return {
        destination: tx.txo._parent.options.address,
        data: tx.txo.encodeABI(),
        value: valueToString(tx.value),
      }
    } else {
      return {
        destination: tx._parent.options.address,
        data: tx.encodeABI(),
        value: '0',
      }
    }
  }
}

export const buildMetaTxTypedData = (
  walletAddress: Address,
  tx: RawTransaction,
  nonce: number,
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
    message: tx ? { ...tx, nonce } : {},
  }
}
