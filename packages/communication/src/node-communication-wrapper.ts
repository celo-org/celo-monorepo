import { toChecksumAddress } from '@celo/utils/lib/address'
import debugFactory from 'debug'
import Web3 from 'web3'
import { AbiCoder } from './abi'
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
} from './commons'
import { decodeStringParameter } from './utils/abi-utils'
import { hasProperty } from './utils/provider-utils'
import { DefaultRpcCaller, RpcCaller } from './utils/rpc-caller'
import { TxParamsNormalizer } from './utils/tx-params-normalizer'
import { toTxResult, TransactionResult } from './utils/tx-result'
import { ReadOnlyWallet } from './wallet'

const debugGasEstimation = debugFactory('communication:gas-estimation')

export interface CommunicationOptions {
  gasInflationFactor: number
  gasPrice: string
  feeCurrency?: Address
  from?: Address
}

export class NodeCommunicationWrapper {
  private config: CommunicationOptions
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
   * Token in which the gas will be paid. Should be a currency listed in the FeeCurrencyWhitelist contract
   * default: undefined (CELO)
   * @param tokenAddress
   */
  async setFeeCurrency(tokenAddress?: Address) {
    this.config.feeCurrency = tokenAddress
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
        .then((response) => {
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
  async sendTransaction(tx: CeloTx): Promise<TransactionResult> {
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

  async sendTransactionObject(
    txObj: CeloTxObject<any>,
    tx?: Omit<CeloTx, 'data'>
  ): Promise<TransactionResult> {
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

  async sendSignedTransaction(signedTransactionData: string): Promise<TransactionResult> {
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

  async estimateGas(
    tx: CeloTx,
    gasEstimator?: (tx: CeloTx) => Promise<number>,
    caller?: (tx: CeloTx) => Promise<string>
  ): Promise<number> {
    if (!gasEstimator) {
      gasEstimator = async (_tx: CeloTx) => {
        // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_estimategas
        const gasResult = await this.rpcCaller.call('eth_estimateGas', [_tx])
        return gasResult.result as number
      }
    }

    if (!caller) {
      caller = async (_tx: CeloTx) => {
        const callResult = await this.rpcCaller.call('eth_call', [_tx])
        return callResult.result as string
      }
    }

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
      debugGasEstimation('estimatedGas failed: %s', revertReason)
      return Promise.reject(`Gas estimation failed: ${revertReason}`)
    }
  }

  getAbiCoder(): AbiCoder {
    return (this.web3.eth.abi as unknown) as AbiCoder
  }

  async estimateGasWithInflationFactor(
    tx: CeloTx,
    gasEstimator?: (tx: CeloTx) => Promise<number>,
    caller?: (tx: CeloTx) => Promise<string>
  ): Promise<number> {
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

  async chainId(): Promise<number> {
    // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#net_version
    const result = await this.rpcCaller.call('net_version', [])
    return parseInt(result.result.toString(), 10)
  }

  async getTransactionCount(address: Address): Promise<number> {
    // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_gettransactioncount
    const result = await this.rpcCaller.call('eth_getTransactionCount', [address, 'pending'])

    const nonce = parseInt(result.result.toString(), 16)
    return nonce
  }

  async nonce(address: Address): Promise<number> {
    return this.getTransactionCount(address)
  }

  async coinbase(): Promise<string> {
    // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_coinbase
    const result = await this.rpcCaller.call('eth_coinbase', [])
    return result.result.toString()
  }

  async gasPrice(feeCurrency?: Address): Promise<string> {
    // Required otherwise is not backward compatible
    const parameter = feeCurrency ? [feeCurrency] : []

    // Reference: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_gasprice
    const response = await this.rpcCaller.call('eth_gasPrice', parameter)
    const gasPriceInHex = response.result.toString()
    return gasPriceInHex
  }

  async getBlockNumber(): Promise<number> {
    return this.web3.eth.getBlockNumber()
  }

  async getBlock(blockHashOrBlockNumber: BlockNumber): Promise<Block> {
    return this.web3.eth.getBlock(blockHashOrBlockNumber, true)
  }

  async getBalance(address: Address, defaultBlock?: BlockNumber): Promise<string> {
    if (defaultBlock) {
      return this.web3.eth.getBalance(address, defaultBlock)
    }
    return this.web3.eth.getBalance(address)
  }

  async getTransaction(transactionHash: string): Promise<CeloTxPending> {
    return this.web3.eth.getTransaction(transactionHash)
  }

  async getTransactionReceipt(txhash: string): Promise<CeloTxReceipt> {
    return this.web3.eth.getTransactionReceipt(txhash)
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
