import { Callback, ErrorCallback, PrivateKeyWalletSubprovider } from '@0x/subproviders'
import debugFactory from 'debug'
import { JSONRPCRequestPayload } from 'ethereum-types'
import Web3 from 'web3'
import { gasInflationFactor } from '../consts'
import { GasPriceMinimum } from '../generated/types/GasPriceMinimum'
import { signTransaction } from '../utils/signing-utils'
import { CeloPartialTxParams } from '../utils/tx-signing'
import { Web3ContractCache } from '../web3-contract-cache'

const debug = debugFactory('kit:providers:celo-private-keys-subprovider')

function getPrivateKeyWithout0xPrefix(privateKey: string) {
  return privateKey.toLowerCase().startsWith('0x') ? privateKey.substring(2) : privateKey
}

export function generateAccountAddressFromPrivateKey(privateKey: string): string {
  if (!privateKey.toLowerCase().startsWith('0x')) {
    privateKey = '0x' + privateKey
  }
  return new Web3().eth.accounts.privateKeyToAccount(privateKey).address
}

function isEmpty(value: string | undefined) {
  return (
    value === undefined ||
    value === null ||
    value === '0' ||
    value.toLowerCase() === '0x' ||
    value.toLowerCase() === '0x0'
  )
}

/**
 * This class supports storing multiple private keys for signing.
 * The base class PrivateKeyWalletSubprovider only supports one key.
 */
export class CeloPrivateKeysWalletProvider extends PrivateKeyWalletSubprovider {
  // Account addresses are hex-encoded, lower case alphabets
  private readonly accountAddressToPrivateKey = new Map<string, string>()
  private readonly contractsCache: Web3ContractCache

  private chainId: number | null = null
  private gasFeeRecipient: string | null = null

  constructor(readonly web3ContractsCache: Web3ContractCache, readonly privateKey: string) {
    // This won't accept a privateKey with 0x prefix and will call that an invalid key.
    super(getPrivateKeyWithout0xPrefix(privateKey))
    this.addAccount(privateKey)
    this.contractsCache = web3ContractsCache
  }

  public addAccount(privateKey: string) {
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    privateKey = '0x' + getPrivateKeyWithout0xPrefix(privateKey)
    const accountAddress = generateAccountAddressFromPrivateKey(privateKey).toLowerCase()
    if (this.accountAddressToPrivateKey.has(accountAddress)) {
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
      return super.handleRequest(payload, next, end)
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
    if (txParams.chainId === undefined || txParams.chainId === null) {
      txParams.chainId = await this.getChainId()
    }

    if (txParams.chainId === undefined || txParams.nonce === null) {
      txParams.nonce = await this.getNonce(txParams.from)
    }

    if (isEmpty(txParams.gasFeeRecipient)) {
      txParams.gasFeeRecipient = await this.getCoinbase()
      if (isEmpty(txParams.gasFeeRecipient)) {
        // Fail early. The validator nodes will reject a transaction missing
        // gas fee recipient anyways.
        throw new Error(
          'Gas fee recipient is missing, cannot retrieve it' +
            ' from web3.eth.getCoinbase() either cannot process transaction'
        )
      }
    }

    if (isEmpty(txParams.gasPrice)) {
      // TODO(ashishb): For now, this will only work when gas payments are in Celo Gold
      // It won't work when the gas payments are in C$.
      txParams.gasPrice = await this.getGasPrice(this.contractsCache, txParams.gasCurrency)
    }
    debug('Gas price for the transaction is %s', txParams.gasPrice)

    if (isEmpty(txParams.gas)) {
      txParams.gas = String(Math.round((await this.getGasEstimate(txParams)) * gasInflationFactor))
    }
    debug('Max gas fee for the transaction is %s', txParams.gas)

    const signedTx = await signTransaction(txParams, this.getPrivateKeyFor(txParams.from))
    const rawTransaction = signedTx.rawTransaction.toString('hex')
    return rawTransaction
  }

  private canSign(from: string): boolean {
    return this.accountAddressToPrivateKey.has(from.toLocaleLowerCase())
  }

  private getPrivateKeyFor(account: string): string {
    const maybePk = this.accountAddressToPrivateKey.get(account.toLowerCase())
    if (maybePk == null) {
      throw new Error(`tx-signing@getPrivateKey: ForPrivate key not found for ${account}`)
    }
    return maybePk
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

  private async getGasPrice(
    web3Contracts: Web3ContractCache,
    gasCurrency: string | undefined
  ): Promise<string | undefined> {
    // Gold Token
    if (gasCurrency === undefined) {
      return this.getGasPriceInCeloGold()
    }
    const gasPriceMinimum: GasPriceMinimum = await web3Contracts.getGasPriceMinimum()
    const gasPrice: string = await gasPriceMinimum.methods.getGasPriceMinimum(gasCurrency).call()
    debug('getGasPrice gas price for currency %s is %s', gasCurrency, gasPrice)
    return gasPrice
  }

  private async getGasPriceInCeloGold(): Promise<string> {
    debug('getGasPriceInCeloGold fetching gas price...')
    // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_gasprice
    const result = await this.emitPayloadAsync({
      method: 'eth_gasPrice',
      params: [],
    })
    const gasPriceInHex = result.result.toString()
    debug('getGasPriceInCeloGold gas price is %s', parseInt(gasPriceInHex.substr(2), 16))
    return gasPriceInHex
  }

  private async getGasEstimate(txParams: CeloPartialTxParams): Promise<number> {
    debug('getGasEstimate fetching gas estimate...')
    // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_estimategas
    const result = await this.emitPayloadAsync({
      method: 'eth_estimateGas',
      params: [txParams],
    })
    const gasEstimateInHex = result.result.toString()
    const gasEstimate = parseInt(gasEstimateInHex.substr(2), 16)
    debug('getGasEstimate gas estimate is %s', gasEstimate)
    return gasEstimate
  }
}
