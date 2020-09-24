import { ensureLeading0x, trimLeading0x } from '@celo/base'
import { Signature } from '@celo/base/lib/signatureUtils'
import { EIP712TypedData, generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import { HttpProvider } from 'web3-core'
import { TransactionObject } from 'web3-eth'
import { Contract } from 'web3-eth-contract'
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

export interface TransactionWrapper<T> {
  txo: TransactionObject<T>
  value?: BigNumber.Value
}

/**
 * Class that wraps the MetaTransactionWallet
 */
export class MetaTransactionWalletWrapper extends BaseWrapper<MetaTransactionWallet> {
  /**
   * Execute a transaction originating from the MTW
   * Reverts if the caller is not a signer
   * @param tx a MTWTransaction
   */
  public executeTransaction<T>(wrappedTx: TransactionWrapper<T>): CeloTransactionObject<string> {
    return toTransactionObject(
      this.kit,
      this.contract.methods.executeTransaction(
        getTxoDestination(wrappedTx.txo),
        numericToHex(wrappedTx.value),
        wrappedTx.txo.encodeABI()
      )
    )
  }

  /**
   * Execute a batch of transactions originating from the MTW
   * Reverts if the caller is not a signer
   * @param txs An array of MTWTransactions
   */
  public executeTransactions(
    wrappedTxs: Array<TransactionWrapper<any>>
  ): CeloTransactionObject<void> {
    const destinations = wrappedTxs.map((wtx) => getTxoDestination(wtx.txo))
    const values = wrappedTxs.map((wtx) => numericToHex(wtx.value))
    const callData = ensureLeading0x(
      wrappedTxs.map((wtx) => trimLeading0x(wtx.txo.encodeABI())).join('')
    )
    const callDataLengths = wrappedTxs.map((wtx) => trimLeading0x(wtx.txo.encodeABI()).length / 2)

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
    wrappedTx: TransactionWrapper<any>,
    signature: Signature
  ): CeloTransactionObject<string> {
    return toTransactionObject(
      this.kit,
      this.contract.methods.executeMetaTransaction(
        getTxoDestination(wrappedTx.txo),
        numericToHex(wrappedTx.value),
        wrappedTx.txo.encodeABI(),
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
  async signMetaTransaction(
    wrappedTx: TransactionWrapper<any>,
    nonce?: number
  ): Promise<Signature> {
    if (nonce === undefined) {
      nonce = await this.nonce()
    }
    const typedData = buildMetaTxTypedData(this.address, wrappedTx, nonce, await this.chainId())
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
    wrappedTx: TransactionWrapper<any>
  ): Promise<CeloTransactionObject<string>> {
    const signature = await this.signMetaTransaction(wrappedTx)
    return this.executeMetaTransaction(wrappedTx, signature)
  }

  private getMetaTransactionDigestParams = (
    tx: TransactionWrapper<any>,
    nonce: number
  ): [string, string, string, number] => [
    getTxoDestination(tx.txo),
    numericToHex(tx.value),
    tx.txo.encodeABI(),
    nonce,
  ]
  getMetaTransactionDigest = proxyCall(
    this.contract.methods.getMetaTransactionDigest,
    this.getMetaTransactionDigestParams,
    stringIdentity
  )

  private getMetaTransactionSignerParams = (
    tx: TransactionWrapper<any>,
    nonce: number,
    signature: Signature
  ): [string, string, string, number, number, string, string] => [
    getTxoDestination(tx.txo),
    numericToHex(tx.value),
    tx.txo.encodeABI(),
    nonce,
    signature.v,
    signature.r,
    signature.s,
  ]
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
}

const getTxoDestination = (txo: TransactionObject<any>): string => {
  // XXX: Slight hack alert - getting the parent contract from a txo
  //      I'm not sure why it's not included in the type, but it's always there
  //      from what I could find.
  const parent = (txo as any)._parent as Contract
  return parent.options.address
}

export const buildMetaTxTypedData = (
  walletAddress: Address,
  tx: TransactionWrapper<any>,
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
    message: tx
      ? {
          destination: getTxoDestination(tx.txo),
          value: numericToHex(tx.value),
          data: tx.txo.encodeABI(),
          nonce,
        }
      : {},
  }
}
