import { ensureLeading0x, toChecksumAddress } from '@celo/utils/lib/address'
import { EIP712TypedData, generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix, Signature } from '@celo/utils/lib/signatureUtils'
import debugFactory from 'debug'
import Web3 from 'web3'
import { AbiCoder } from './abi-types'
import { assertIsCeloProvider, CeloProvider } from './celo-provider'
import {
  Address,
  Block,
  BlockNumber,
  CeloTx,
  CeloTxObject,
  CeloTxPending,
  CeloTxReceipt,
  Provider,
  Syncing,
} from './types'
import { decodeStringParameter } from './utils/abi-utils'
import {
  hexToNumber,
  inputAddressFormatter,
  inputBlockNumberFormatter,
  inputDefaultBlockNumberFormatter,
  inputSignFormatter,
  outputBigNumberFormatter,
  outputBlockFormatter,
  outputCeloTxFormatter,
  outputCeloTxReceiptFormatter,
} from './utils/formatter'
import { hasProperty } from './utils/provider-utils'
import { DefaultRpcCaller, RpcCaller } from './utils/rpc-caller'
import { TxParamsNormalizer } from './utils/tx-params-normalizer'
import { toTxResult, TransactionResult } from './utils/tx-result'
import { ReadOnlyWallet } from './wallet'

const debugGasEstimation = debugFactory('connection:gas-estimation')

export interface ConnectionOptions {
  gasInflationFactor: number
  gasPrice: string
  feeCurrency?: Address
  from?: Address
}

export class Connection {
  private config: ConnectionOptions
  readonly paramsPopulator: TxParamsNormalizer
  rpcCaller!: RpcCaller

  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  private currencyGasPrice: Map<Address, string> = new Map<Address, string>()

  constructor(readonly web3: Web3, public wallet?: ReadOnlyWallet) {
    this.config = {
      gasInflationFactor: 1.3,
      // gasPrice:0 means the node will compute gasPrice on its own
      gasPrice: '0',
    }

    const existingProvider: Provider = web3.currentProvider as Provider
    this.setProvider(existingProvider)
    // TODO: Add this line with the wallets separation completed
    // this.wallet = _wallet ?? new LocalWallet()
    this.config.from = web3.eth.defaultAccount ?? undefined
    this.paramsPopulator = new TxParamsNormalizer(this)
  }

  setProvider(provider: Provider) {
    if (!provider) {
      throw new Error('Must have a valid Provider')
    }
    try {
      if (!(provider instanceof CeloProvider)) {
        this.rpcCaller = new DefaultRpcCaller(provider)
        provider = new CeloProvider(provider, this)
      }
      this.web3.setProvider(provider as any)
      return true
    } catch {
      return false
    }
  }

  /**
   * Set default account for generated transactions (eg. tx.from )
   */
  set defaultAccount(address: Address | undefined) {
    this.config.from = address
    this.web3.eth.defaultAccount = address ? address : null
  }

  /**
   * Default account for generated transactions (eg. tx.from)
   */
  get defaultAccount(): Address | undefined {
    return this.config.from
  }

  set defaultGasInflationFactor(factor: number) {
    this.config.gasInflationFactor = factor
  }

  get defaultGasInflationFactor() {
    return this.config.gasInflationFactor
  }

  set defaultGasPrice(price: number) {
    this.config.gasPrice = price.toString(10)
  }

  get defaultGasPrice() {
    return parseInt(this.config.gasPrice, 10)
  }

  /**
   * Set the ERC20 address for the token to use to pay for transaction fees.
   * The ERC20 must be whitelisted for gas.
   *
   * Set to `null` to use CELO
   *
   * @param address ERC20 address
   */
  set defaultFeeCurrency(address: Address | undefined) {
    this.config.feeCurrency = address
  }

  get defaultFeeCurrency() {
    return this.config.feeCurrency
  }

  isLocalAccount(address?: Address): boolean {
    return this.wallet != null && this.wallet.hasAccount(address)
  }

  addAccount(privateKey: string) {
    if (this.wallet) {
      if (hasProperty<{ addAccount: (privateKey: string) => void }>(this.wallet, 'addAccount')) {
        this.wallet.addAccount(privateKey)
      } else {
        throw new Error("The wallet used, can't add accounts")
      }
    } else {
      throw new Error('No wallet set')
    }
  }

  removeAccount(address: string) {
    if (this.wallet) {
      if (hasProperty<{ removeAccount: (address: string) => void }>(this.wallet, 'removeAccount')) {
        this.wallet.removeAccount(address)
      } else {
        throw new Error("The wallet used, can't remove accounts")
      }
    } else {
      throw new Error('No wallet set')
    }
  }

  async getNodeAccounts(): Promise<string[]> {
    const nodeAccountsResp = await this.rpcCaller.call('eth_accounts', [])
    return this.toChecksumAddresses(nodeAccountsResp.result ?? [])
  }

  getLocalAccounts(): string[] {
    return this.wallet ? this.toChecksumAddresses(this.wallet.getAccounts()) : []
  }

  async getAccounts(): Promise<string[]> {
    return (await this.getNodeAccounts()).concat(this.getLocalAccounts())
  }

  private toChecksumAddresses(addresses: string[]) {
    return addresses.map((value) => toChecksumAddress(value))
  }

  isListening(): Promise<boolean> {
    return this.web3.eth.net.isListening()
  }

  isSyncing(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.web3.eth
        .isSyncing()
        .then((response: boolean | Syncing) => {
          // isSyncing returns a syncProgress object when it's still syncing
          if (typeof response === 'boolean') {
            resolve(response)
          } else {
            resolve(true)
          }
        })
        .catch(reject)
    })
  }

  /**
   * Send a transaction to celo-blockchain.
   *
   * Similar to `web3.eth.sendTransaction()` but with following differences:
   *  - applies kit tx's defaults
   *  - estimatesGas before sending
   *  - returns a `TransactionResult` instead of `PromiEvent`
   */
  sendTransaction = async (tx: CeloTx): Promise<TransactionResult> => {
    tx = this.fillTxDefaults(tx)
    tx = this.fillGasPrice(tx)

    let gas = tx.gas
    if (gas == null) {
      gas = await this.estimateGasWithInflationFactor(tx)
    }

    return toTxResult(
      this.web3.eth.sendTransaction({
        ...tx,
        gas,
      })
    )
  }

  sendTransactionObject = async (
    txObj: CeloTxObject<any>,
    tx?: Omit<CeloTx, 'data'>
  ): Promise<TransactionResult> => {
    tx = this.fillTxDefaults(tx)
    tx = this.fillGasPrice(tx)

    let gas = tx.gas
    if (gas == null) {
      const gasEstimator = (_tx: CeloTx) => txObj.estimateGas({ ..._tx })
      const getCallTx = (_tx: CeloTx) => {
        // @ts-ignore missing _parent property from TransactionObject type.
        return { ..._tx, data: txObj.encodeABI(), to: txObj._parent._address }
      }
      const caller = (_tx: CeloTx) => this.web3.eth.call(getCallTx(_tx))
      gas = await this.estimateGasWithInflationFactor(tx, gasEstimator, caller)
    }

    return toTxResult(
      txObj.send({
        ...tx,
        gas,
      })
    )
  }

  signTypedData = async (signer: string, typedData: EIP712TypedData): Promise<Signature> => {
    // Uses the Provider and not the RpcCaller, because this method should be intercepted
    // by the CeloProvider if there is a local wallet that could sign it. The RpcCaller
    // would just forward it to the node
    const signature = await new Promise<string>((resolve, reject) => {
      ;(this.web3.currentProvider as Provider).send(
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

  sign = async (dataToSign: string, address: Address | number): Promise<string> => {
    // Uses the Provider and not the RpcCaller, because this method should be intercepted
    // by the CeloProvider if there is a local wallet that could sign it. The RpcCaller
    // would just forward it to the node
    const signature = await new Promise<string>((resolve, reject) => {
      ;(this.web3.currentProvider as Provider).send(
        {
          jsonrpc: '2.0',
          method: 'eth_sign',
          params: [inputAddressFormatter(address.toString()), inputSignFormatter(dataToSign)],
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

    return signature
  }

  sendSignedTransaction = async (signedTransactionData: string): Promise<TransactionResult> => {
    return toTxResult(this.web3.eth.sendSignedTransaction(signedTransactionData))
  }

  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  fillGasPrice(tx: CeloTx): CeloTx {
    if (tx.feeCurrency && tx.gasPrice === '0' && this.currencyGasPrice.has(tx.feeCurrency)) {
      return {
        ...tx,
        gasPrice: this.currencyGasPrice.get(tx.feeCurrency),
      }
    }
    return tx
  }
  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  async setGasPriceForCurrency(address: Address, gasPrice: string) {
    this.currencyGasPrice.set(address, gasPrice)
  }

  estimateGas = async (
    tx: CeloTx,
    gasEstimator: (tx: CeloTx) => Promise<number> = this.web3.eth.estimateGas,
    caller: (tx: CeloTx) => Promise<string> = this.web3.eth.call
  ): Promise<number> => {
    try {
      const gas = await gasEstimator({ ...tx })
      debugGasEstimation('estimatedGas: %s', gas.toString())
      return gas
    } catch (e) {
      const called = await caller({ data: tx.data, to: tx.to, from: tx.from })
      let revertReason = 'Could not decode transaction failure reason'
      if (called.startsWith('0x08c379a')) {
        revertReason = decodeStringParameter(this.getAbiCoder(), called.substring(10))
      }
      debugGasEstimation('Recover transaction failure reason', {
        called,
        data: tx.data,
        to: tx.to,
        from: tx.from,
        error: e,
        revertReason,
      })
      return Promise.reject(`Gas estimation failed: ${revertReason} or ${e}`)
    }
  }

  getAbiCoder(): AbiCoder {
    return (this.web3.eth.abi as unknown) as AbiCoder
  }

  estimateGasWithInflationFactor = async (
    tx: CeloTx,
    gasEstimator?: (tx: CeloTx) => Promise<number>,
    caller?: (tx: CeloTx) => Promise<string>
  ): Promise<number> => {
    try {
      const gas = Math.round(
        (await this.estimateGas(tx, gasEstimator, caller)) * this.config.gasInflationFactor
      )
      debugGasEstimation('estimatedGasWithInflationFactor: %s', gas)
      return gas
    } catch (e) {
      throw new Error(e)
    }
  }

  chainId = async (): Promise<number> => {
    // Reference: https://eth.wiki/json-rpc/API#net_version
    const response = await this.rpcCaller.call('net_version', [])
    return parseInt(response.result.toString(), 10)
  }

  getTransactionCount = async (address: Address): Promise<number> => {
    // Reference: https://eth.wiki/json-rpc/API#eth_gettransactioncount
    const response = await this.rpcCaller.call('eth_getTransactionCount', [address, 'pending'])

    return hexToNumber(response.result)!
  }

  nonce = async (address: Address): Promise<number> => {
    return this.getTransactionCount(address)
  }

  coinbase = async (): Promise<string> => {
    // Reference: https://eth.wiki/json-rpc/API#eth_coinbase
    const response = await this.rpcCaller.call('eth_coinbase', [])
    return response.result.toString()
  }

  gasPrice = async (feeCurrency?: Address): Promise<string> => {
    // Required otherwise is not backward compatible
    const parameter = feeCurrency ? [feeCurrency] : []

    // Reference: https://eth.wiki/json-rpc/API#eth_gasprice
    const response = await this.rpcCaller.call('eth_gasPrice', parameter)
    const gasPriceInHex = response.result.toString()
    return gasPriceInHex
  }

  getBlockNumber = async (): Promise<number> => {
    const response = await this.rpcCaller.call('eth_blockNumber', [])

    return hexToNumber(response.result)!
  }

  getBlock = async (
    blockHashOrBlockNumber: BlockNumber,
    fullTxObjects: boolean = true
  ): Promise<Block> => {
    // Reference: https://eth.wiki/json-rpc/API#eth_getBlockByNumber
    let fnCall = 'eth_getBlockByNumber'
    if (blockHashOrBlockNumber instanceof String && blockHashOrBlockNumber.indexOf('0x') === 0) {
      // Reference: https://eth.wiki/json-rpc/API#eth_getBlockByHash
      fnCall = 'eth_getBlockByHash'
    }

    const response = await this.rpcCaller.call(fnCall, [
      inputBlockNumberFormatter(blockHashOrBlockNumber),
      fullTxObjects,
    ])

    return outputBlockFormatter(response.result)
  }

  getBalance = async (address: Address, defaultBlock?: BlockNumber): Promise<string> => {
    // Reference: https://eth.wiki/json-rpc/API#eth_getBalance
    const response = await this.rpcCaller.call('eth_getBalance', [
      inputAddressFormatter(address),
      inputDefaultBlockNumberFormatter(defaultBlock),
    ])
    return outputBigNumberFormatter(response.result)
  }

  getTransaction = async (transactionHash: string): Promise<CeloTxPending> => {
    // Reference: https://eth.wiki/json-rpc/API#eth_getTransactionByHash
    const response = await this.rpcCaller.call('eth_getTransactionByHash', [
      ensureLeading0x(transactionHash),
    ])
    return outputCeloTxFormatter(response.result)
  }

  getTransactionReceipt = async (txhash: string): Promise<CeloTxReceipt> => {
    // Reference: https://eth.wiki/json-rpc/API#eth_getTransactionReceipt
    const response = await this.rpcCaller.call('eth_getTransactionReceipt', [
      ensureLeading0x(txhash),
    ])
    return outputCeloTxReceiptFormatter(response.result)
  }

  private fillTxDefaults(tx?: CeloTx): CeloTx {
    const defaultTx: CeloTx = {
      from: this.config.from,
      feeCurrency: this.config.feeCurrency,
      gasPrice: this.config.gasPrice,
    }

    return {
      ...defaultTx,
      ...tx,
    }
  }

  stop() {
    assertIsCeloProvider(this.web3.currentProvider)
    this.web3.currentProvider.stop()
  }
}
