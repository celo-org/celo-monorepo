import { PartialTxParams, PrivateKeyWalletSubprovider } from '@0x/subproviders'
import debugFactory from 'debug'
import Web3 from 'web3'
import { Tx } from 'web3/eth/types'
import { signTransaction } from './signing-utils'

const debug = debugFactory('kit:tx:sign')

export interface CeloTx extends Tx {
  gasCurrency?: string
  gasFeeRecipient?: string
}

export interface CeloPartialTxParams extends PartialTxParams {
  gasCurrency?: string
  gasFeeRecipient?: string
}

function getPrivateKeyWithout0xPrefix(privateKey: string) {
  return privateKey.toLowerCase().startsWith('0x') ? privateKey.substring(2) : privateKey
}

export class CeloProvider extends PrivateKeyWalletSubprovider {
  private readonly celoPrivateKey: string // Always 0x prefixed
  private _chainId: number | null = null

  constructor(privateKey: string) {
    // This won't accept a privateKey with 0x prefix and will call that an invalid key.
    super(getPrivateKeyWithout0xPrefix(privateKey))
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    this.celoPrivateKey = '0x' + getPrivateKeyWithout0xPrefix(privateKey)
  }

  public async signTransactionAsync(txParams: CeloPartialTxParams): Promise<string> {
    debug('signTransactionAsync: txParams are %o', txParams)
    if (txParams.chainId === undefined || txParams.chainId === null) {
      txParams.chainId = await this.getChainId()
    }
    const signedTx = await signTransaction(txParams, this.celoPrivateKey)
    const rawTransaction = signedTx.rawTransaction.toString('hex')
    return rawTransaction
  }

  private async getChainId(): Promise<number> {
    if (this._chainId === null) {
      debug('getChainId fetching chainId...')
      const chainIdResult = await this.emitPayloadAsync({
        method: 'net_version',
        params: [],
      })
      this._chainId = parseInt(chainIdResult.result.toString(), 10)
      debug('getChainId chain result ID is %s', this._chainId)
    }
    return this._chainId!
  }
}

/**
 * This method is primarily used for testing at this point.
 * Returns a raw signed transaction which can be used for Celo gold transfer.
 * It is the responsibility of the caller to submit it to the network.
 */
export async function getRawTransaction(web3: Web3, transaction: CeloTx): Promise<string> {
  debug('getRawTransaction@Signing transaction...')
  const signedTransaction = await web3.eth.signTransaction(transaction)
  debug('getRawTransaction@Signing: Signed transaction %o', signedTransaction)
  const rawTransaction = signedTransaction.raw
  return rawTransaction
}
