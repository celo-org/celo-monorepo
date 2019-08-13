import { PartialTxParams, PrivateKeyWalletSubprovider } from '@0x/subproviders'
import { BigNumber } from 'bignumber.js'
import Web3 from 'web3'
import { Tx } from 'web3/eth/types'
import { Logger } from './logger'
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
  private _chainId: number | null = null

  constructor(privateKey: string) {
    // This won't accept a privateKey with 0x prefix and will call that an invalid key.
    super(CeloProvider.getPrivateKeyWithout0xPrefix(privateKey))
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    this._celoPrivateKey = '0x' + CeloProvider.getPrivateKeyWithout0xPrefix(privateKey)
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
