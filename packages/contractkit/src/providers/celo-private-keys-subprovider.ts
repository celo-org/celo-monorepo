import { Callback, ErrorCallback, PrivateKeyWalletSubprovider } from '@0x/subproviders'
import debugFactory from 'debug'
import { JSONRPCRequestPayload } from 'ethereum-types'
import Web3 from 'web3'
import { signTransaction } from '../utils/signing-utils'
import { CeloPartialTxParams } from '../utils/tx-signing'

const debug = debugFactory('kit:providers:celo-private-keys-subprovider')

function getPrivateKeyWithout0xPrefix(privateKey: string) {
  return privateKey.toLowerCase().startsWith('0x') ? privateKey.substring(2) : privateKey
}

function isNullOrUndefined(value: any): boolean {
  return value === null || value === undefined
}

export function generateAccountAddressFromPrivateKey(privateKey: string): string {
  if (!privateKey.toLowerCase().startsWith('0x')) {
    privateKey = '0x' + privateKey
  }
  return new Web3().eth.accounts.privateKeyToAccount(privateKey).address
}

/**
 * This class supports storing multiple private keys for signing.
 * The base class PrivateKeyWalletSubprovider only supports one key.
 */
export class CeloPrivateKeysWalletProvider extends PrivateKeyWalletSubprovider {
  // Account addresses are hex-encoded, lower case alphabets
  private readonly accountAddressToPrivateKey = new Map<string, string>()

  private chainId: number | null = null
  private gasFeeRecipient: string | null = null

  constructor(privateKey: string) {
    // This won't accept a privateKey with 0x prefix and will call that an invalid key.
    super(getPrivateKeyWithout0xPrefix(privateKey))
    this.addAccount(privateKey)
  }

  public addAccount(privateKey: string) {
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    privateKey = '0x' + getPrivateKeyWithout0xPrefix(privateKey)
    const accountAddress = generateAccountAddressFromPrivateKey(privateKey).toLowerCase()
    if (this.getAccounts().includes(accountAddress)) {
      debug('Accounts %o is already added', accountAddress)
      return
    }
    this.accountAddressToPrivateKey.set(accountAddress, privateKey)
  }

  public getAccounts(): string[] {
    return Array.from(this.accountAddressToPrivateKey.keys())
  }

  // Over-riding parent class method
  public async getAccountsAsync(): Promise<string[]> {
    return this.getAccounts()
  }

  public async handleRequest(
    payload: JSONRPCRequestPayload,
    next: Callback,
    end: ErrorCallback
  ): Promise<void> {
    const signingRequired = [
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
    ].includes(payload.method)
    // Either signing is not required or
    // signing is required and this class is the correct one to sign
    const shouldPassToSuperClassForHandling =
      !signingRequired || this.canSign(payload.params[0].from)
    if (shouldPassToSuperClassForHandling) {
      super.handleRequest(payload, next, end)
    } else {
      // Pass it to the next handler to sign
      next()
    }
  }

  public async signTransactionAsync(txParams: CeloPartialTxParams): Promise<string> {
    debug('signTransactionAsync: txParams are %o', txParams)
    if (!this.canSign(txParams.from)) {
      // If `handleRequest` works correctly then this code path should never trigger.
      throw new Error(
        `Transaction ${JSON.stringify(
          txParams
        )} cannot be signed by any of accounts "${this.getAccounts()}",` +
          ` it should be signed by "${txParams.from}"`
      )
    } else {
      debug(`Signer is ${txParams.from} and is one  of ${this.getAccounts()}`)
    }
    if (isNullOrUndefined(txParams.chainId)) {
      txParams.chainId = await this.getChainId()
    }

    if (isNullOrUndefined(txParams.nonce)) {
      txParams.nonce = await this.getNonce(txParams.from)
    }

    if (isNullOrUndefined(txParams.gasFeeRecipient)) {
      txParams.gasFeeRecipient = await this.getCoinbase()
      if (isNullOrUndefined(txParams.gasFeeRecipient)) {
        // Fail early. The validator nodes will reject a transaction missing
        // gas fee recipient anyways.
        throw new Error(
          'Gas fee recipient is missing, cannot retrieve it' +
            ' from web3.eth.getCoinbase() either cannot process transaction'
        )
      }
    }

    if (isNullOrUndefined(txParams.gasPrice)) {
      txParams.gasPrice = await this.getGasPrice()
    }

    const signedTx = await signTransaction(txParams, this.getPrivateKeyFor(txParams.from))
    const rawTransaction = signedTx.rawTransaction.toString('hex')
    return rawTransaction
  }

  private canSign(from: string): boolean {
    return this.getAccounts().includes(from.toLocaleLowerCase())
  }

  private getPrivateKeyFor(account: string): string {
    account = account.toLowerCase()
    if (this.accountAddressToPrivateKey.has(account)) {
      return this.accountAddressToPrivateKey.get(account)!
    } else {
      throw new Error(`tx-signing@getPrivateKey: ForPrivate key not found for ${account}`)
    }
  }

  private async getChainId(): Promise<number> {
    if (this.chainId === null) {
      debug('getChainId fetching chainId...')
      // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#net_version
      const result = await this.emitPayloadAsync({
        method: 'net_version',
        params: [],
      })
      this.chainId = parseInt(result.result.toString(), 10)
      debug('getChainId chain result ID is %s', this.chainId)
    }
    return this.chainId!
  }

  private async getNonce(address: string): Promise<string> {
    debug('getNonce fetching nonce...')
    // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_gettransactioncount
    const result = await this.emitPayloadAsync({
      method: 'eth_getTransactionCount',
      params: [address, 'pending'],
    })
    const nonce = result.result.toString()
    debug('getNonce Nonce is %s', nonce)
    return nonce
  }

  private async getCoinbase(): Promise<string> {
    if (this.gasFeeRecipient === null) {
      debug('getCoinbase fetching Coinbase...')
      // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_coinbase
      const result = await this.emitPayloadAsync({
        method: 'eth_coinbase',
        params: [],
      })
      this.gasFeeRecipient = result.result.toString()
      debug('getCoinbase gas fee recipient is %s', this.gasFeeRecipient)
    }
    if (this.gasFeeRecipient == null) {
      throw new Error(
        `Coinbase is null, we are not connected to a full node, cannot sign transactions locally`
      )
    }
    return this.gasFeeRecipient
  }

  private async getGasPrice(): Promise<string> {
    debug('getGasPrice fetching gas price...')
    // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_gasprice
    const result = await this.emitPayloadAsync({
      method: 'eth_gasPrice',
      params: [],
    })
    const gasPriceInHex = result.result.toString()
    debug('getGasPrice gas price is %s', parseInt(gasPriceInHex.substr(2), 16))
    return gasPriceInHex
  }
}
