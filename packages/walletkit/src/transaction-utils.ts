import {
  Callback,
  ErrorCallback,
  JSONRPCRequestPayload,
  PartialTxParams,
  PrivateKeyWalletSubprovider,
} from '@0x/subproviders'
import { BigNumber } from 'bignumber.js'
import Web3 from 'web3'
import { Tx } from 'web3/eth/types'
import { Logger } from './logger'
import { getAccountAddressFromPrivateKey } from './new-web3-utils'
import { signTransaction } from './signing-utils'

export interface CeloTransaction extends Tx {
  gasCurrency?: string
  gasFeeRecipient?: string
}

export interface CeloPartialTxParams extends PartialTxParams {
  gasCurrency?: string
  gasFeeRecipient?: string
}

export class CeloProvider extends PrivateKeyWalletSubprovider {
  private static getPrivateKeyWithout0xPrefix(privateKey: string) {
    return privateKey.toLowerCase().startsWith('0x') ? privateKey.substring(2) : privateKey
  }

  private readonly _celoPrivateKey: string // Always 0x prefixed
  private readonly accountAddress: string // hex-encoded, lower case alphabets
  private _chainId: number | null = null

  constructor(privateKey: string) {
    // This won't accept a privateKey with 0x prefix and will call that an invalid key.
    super(CeloProvider.getPrivateKeyWithout0xPrefix(privateKey))
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    this._celoPrivateKey = '0x' + CeloProvider.getPrivateKeyWithout0xPrefix(privateKey)
    this.accountAddress = getAccountAddressFromPrivateKey(this._celoPrivateKey).toLowerCase()
    Logger.debug('CeloProvider@construct', `CeloProvider Account address: ${this.accountAddress}`)
  }

  public getAccounts(): string[] {
    return [this.accountAddress]
  }

  public async handleRequest(
    payload: JSONRPCRequestPayload,
    next: Callback,
    end: ErrorCallback
  ): Promise<void> {
    let signingRequired = false
    switch (payload.method) {
      case 'eth_sendTransaction': // fallthrough
      case 'eth_signTransaction': // fallthrough
      case 'eth_sign': // fallthrough
      case 'personal_sign': // fallthrough
      case 'eth_signTypedData':
        signingRequired = true
    }
    // Either
    // signing is not required or
    // signing is required and this class is the correct one to sign
    const shouldPassToSuperClassForHandling =
      !signingRequired ||
      (payload.params[0].from !== undefined &&
        payload.params[0].from !== null &&
        payload.params[0].from.toLowerCase() === this.accountAddress)
    if (shouldPassToSuperClassForHandling) {
      return super.handleRequest(payload, next, end)
    } else {
      // Pass it to the next handler to sign
      next()
    }
  }

  public async signTransactionAsync(txParams: CeloPartialTxParams): Promise<string> {
    Logger.debug(
      'transaction-utils@signTransactionAsync',
      `txParams are ${JSON.stringify(txParams)}`
    )
    if (txParams.chainId === undefined || txParams.chainId === null) {
      txParams.chainId = await this.getChainId()
    }
    const signedTx: any = await signTransaction(txParams, this._celoPrivateKey)
    const rawTransaction = signedTx.rawTransaction.toString('hex')
    return rawTransaction
  }

  private async getChainId(): Promise<number> {
    if (this._chainId === null) {
      Logger.debug('transaction-utils@getChainId', 'Fetching chainId...')
      const chainIdResult = await this.emitPayloadAsync({
        method: 'net_version',
        params: [],
      })
      this._chainId = parseInt(chainIdResult.result.toString(), 10)
      Logger.debug('transaction-utils@getChainId', `Chain result ID is ${this._chainId}`)
    }
    return this._chainId!
  }
}

/**
 * This method is primarily used for testing at this point.
 * Returns a raw signed transaction which can be used for Celo gold transfer.
 * It is the responsibility of the caller to submit it to the network.
 */
export async function getRawTransaction(
  web3: Web3,
  fromAccountNumber: string,
  toAccountNumber: string,
  nonce: number,
  amount: BigNumber,
  gasFees: BigNumber,
  gasPrice: BigNumber,
  gasFeeRecipient?: string,
  gasCurrency?: string,
  networkId?: number
): Promise<string> {
  const transaction: CeloTransaction = {
    nonce,
    chainId: networkId,
    from: fromAccountNumber,
    to: toAccountNumber,
    value: amount.toString(),
    gas: gasFees.toString(),
    gasPrice: gasPrice.toString(),
    gasCurrency,
    gasFeeRecipient,
  }
  Logger.debug('transaction-utils@getRawTransaction@Signing', 'transaction...')
  const signedTransaction = await web3.eth.signTransaction(transaction)
  Logger.debug(
    'transaction-utils@getRawTransaction@Signing',
    `Signed transaction ${JSON.stringify(signedTransaction)}`
  )
  const rawTransaction = signedTransaction.raw
  return rawTransaction
}
