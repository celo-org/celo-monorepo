import { ensureLeading0x, Signature } from '@celo/base'
import { EIP712TypedData, generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils'
import { BigNumber } from 'bignumber.js'
import debugFactory from 'debug'
import net from 'net'
import Web3 from 'web3'
import { HttpProvider, Tx } from 'web3-core'
import { TransactionObject } from 'web3-eth'
import { AddressRegistry } from './address-registry'
import { Address, CeloContract, CeloToken } from './base'
import { WrapperCache } from './contract-cache'
import { CeloProvider } from './providers/celo-provider'
import { toTxResult, TransactionResult } from './utils/tx-result'
import { estimateGas } from './utils/web3-utils'
import { ReadOnlyWallet } from './wallets/wallet'
import { Web3ContractCache } from './web3-contract-cache'
import { AttestationsConfig } from './wrappers/Attestations'
import { BlockchainParametersConfig } from './wrappers/BlockchainParameters'
import { DowntimeSlasherConfig } from './wrappers/DowntimeSlasher'
import { ElectionConfig } from './wrappers/Election'
import { ExchangeConfig } from './wrappers/Exchange'
import { GasPriceMinimumConfig } from './wrappers/GasPriceMinimum'
import { GovernanceConfig } from './wrappers/Governance'
import { LockedGoldConfig } from './wrappers/LockedGold'
import { ReserveConfig } from './wrappers/Reserve'
import { SortedOraclesConfig } from './wrappers/SortedOracles'
import { StableTokenConfig } from './wrappers/StableTokenWrapper'
import { ValidatorsConfig } from './wrappers/Validators'

const debug = debugFactory('kit:kit')

/**
 * Creates a new instance of `ContractKit` give a nodeUrl
 * @param url CeloBlockchain node url
 * @optional wallet to reuse or add a wallet different that the default (example ledger-wallet)
 */
export function newKit(url: string, wallet?: ReadOnlyWallet) {
  const web3 = url.endsWith('.ipc')
    ? new Web3(new Web3.providers.IpcProvider(url, net))
    : new Web3(url)
  return newKitFromWeb3(web3, wallet)
}

/**
 * Creates a new instance of `ContractKit` give a web3 instance
 * @param web3 Web3 instance
 * @optional wallet to reuse or add a wallet different that the default (example ledger-wallet)
 */
export function newKitFromWeb3(web3: Web3, wallet?: ReadOnlyWallet) {
  if (!web3.currentProvider) {
    throw new Error('Must have a valid Provider')
  }
  return new ContractKit(web3, wallet)
}

function assertIsCeloProvider(provider: any): asserts provider is CeloProvider {
  if (!(provider instanceof CeloProvider)) {
    throw new Error(
      'A different Provider was manually added to the kit. The kit should have a CeloProvider'
    )
  }
}

export interface NetworkConfig {
  election: ElectionConfig
  exchange: ExchangeConfig
  attestations: AttestationsConfig
  governance: GovernanceConfig
  lockedGold: LockedGoldConfig
  sortedOracles: SortedOraclesConfig
  gasPriceMinimum: GasPriceMinimumConfig
  reserve: ReserveConfig
  stableToken: StableTokenConfig
  validators: ValidatorsConfig
  downtimeSlasher: DowntimeSlasherConfig
  blockchainParameters: BlockchainParametersConfig
}

export interface KitOptions {
  gasInflationFactor: number
  gasPrice: string
  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  gasPriceSuggestionMultiplier: number
  feeCurrency?: Address
  from?: Address
}

interface AccountBalance {
  CELO: BigNumber
  cUSD: BigNumber
  lockedCELO: BigNumber
  pending: BigNumber
}

export class ContractKit {
  /** core contract's address registry */
  readonly registry: AddressRegistry
  /** factory for core contract's native web3 wrappers  */
  readonly _web3Contracts: Web3ContractCache
  /** factory for core contract's kit wrappers  */
  readonly contracts: WrapperCache

  private config: KitOptions
  constructor(readonly web3: Web3, wallet?: ReadOnlyWallet) {
    this.config = {
      gasInflationFactor: 1.3,
      // gasPrice:0 means the node will compute gasPrice on its own
      gasPrice: '0',
      gasPriceSuggestionMultiplier: 5,
    }
    if (!(web3.currentProvider instanceof CeloProvider)) {
      const celoProviderInstance = new CeloProvider(web3.currentProvider, wallet)
      // as any because of web3 migration
      web3.setProvider(celoProviderInstance as any)
    }

    this.registry = new AddressRegistry(this)
    this._web3Contracts = new Web3ContractCache(this)
    this.contracts = new WrapperCache(this)
  }

  async getTotalBalance(address: string): Promise<AccountBalance> {
    const celoToken = await this.contracts.getGoldToken()
    const stableToken = await this.contracts.getStableToken()
    const lockedCelo = await this.contracts.getLockedGold()
    const goldBalance = await celoToken.balanceOf(address)
    const lockedBalance = await lockedCelo.getAccountTotalLockedGold(address)
    const dollarBalance = await stableToken.balanceOf(address)
    let pending = new BigNumber(0)
    try {
      pending = await lockedCelo.getPendingWithdrawalsTotalValue(address)
    } catch (err) {
      // Just means that it's not an account
    }

    return {
      CELO: goldBalance,
      lockedCELO: lockedBalance,
      cUSD: dollarBalance,
      pending,
    }
  }

  async getNetworkConfig(): Promise<NetworkConfig> {
    const token1 = await this.registry.addressFor(CeloContract.GoldToken)
    const token2 = await this.registry.addressFor(CeloContract.StableToken)
    // There can only be `10` unique parametrized types in Promise.all call, that is how
    // its typescript typing is setup. Thus, since we crossed threshold of 10
    // have to explicitly cast it to just any type and discard type information.
    const promises: Array<Promise<any>> = [
      this.contracts.getExchange(),
      this.contracts.getElection(),
      this.contracts.getAttestations(),
      this.contracts.getGovernance(),
      this.contracts.getLockedGold(),
      this.contracts.getSortedOracles(),
      this.contracts.getGasPriceMinimum(),
      this.contracts.getReserve(),
      this.contracts.getStableToken(),
      this.contracts.getValidators(),
      this.contracts.getDowntimeSlasher(),
      this.contracts.getBlockchainParameters(),
    ]
    const contracts = await Promise.all(promises)
    const res = await Promise.all([
      contracts[0].getConfig(),
      contracts[1].getConfig(),
      contracts[2].getConfig([token1, token2]),
      contracts[3].getConfig(),
      contracts[4].getConfig(),
      contracts[5].getConfig(),
      contracts[6].getConfig(),
      contracts[7].getConfig(),
      contracts[8].getConfig(),
      contracts[9].getConfig(),
      contracts[10].getConfig(),
      contracts[11].getConfig(),
    ])
    return {
      exchange: res[0],
      election: res[1],
      attestations: res[2],
      governance: res[3],
      lockedGold: res[4],
      sortedOracles: res[5],
      gasPriceMinimum: res[6],
      reserve: res[7],
      stableToken: res[8],
      validators: res[9],
      downtimeSlasher: res[10],
      blockchainParameters: res[11],
    }
  }

  /**
   * Set CeloToken to use to pay for gas fees
   * @param token cUSD (StableToken) or CELO (GoldToken)
   */
  async setFeeCurrency(token: CeloToken): Promise<void> {
    this.config.feeCurrency =
      token === CeloContract.GoldToken ? undefined : await this.registry.addressFor(token)
  }

  addAccount(privateKey: string) {
    assertIsCeloProvider(this.web3.currentProvider)
    this.web3.currentProvider.addAccount(privateKey)
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
    const account = this.web3.eth.defaultAccount
    return account ? account : undefined
  }

  set gasInflationFactor(factor: number) {
    this.config.gasInflationFactor = factor
  }

  get gasInflationFactor() {
    return this.config.gasInflationFactor
  }

  set gasPrice(price: number) {
    this.config.gasPrice = price.toString(10)
  }

  get gasPrice() {
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

  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  async fillGasPrice(tx: Tx): Promise<Tx> {
    if (tx.feeCurrency && tx.gasPrice === '0') {
      const gasPriceMinimum = await this.contracts.getGasPriceMinimum()
      const rawGasPrice = await gasPriceMinimum.getGasPriceMinimum(tx.feeCurrency)
      return {
        ...tx,
        gasPrice: rawGasPrice.multipliedBy(this.config.gasPriceSuggestionMultiplier).toFixed(),
      }
    } else {
      return tx
    }
  }

  /**
   * Send a transaction to celo-blockchain.
   *
   * Similar to `web3.eth.sendTransaction()` but with following differences:
   *  - applies kit tx's defaults
   *  - estimatesGas before sending
   *  - returns a `TransactionResult` instead of `PromiEvent`
   */
  async sendTransaction(tx: Tx): Promise<TransactionResult> {
    tx = this.fillTxDefaults(tx)
    tx = await this.fillGasPrice(tx)

    let gas = tx.gas
    if (gas == null) {
      try {
        gas = Math.round(
          (await estimateGas(tx, this.web3.eth.estimateGas, this.web3.eth.call)) *
            this.config.gasInflationFactor
        )
        debug('estimatedGas: %s', gas)
      } catch (e) {
        throw new Error(e)
      }
    }

    return toTxResult(
      this.web3.eth.sendTransaction({
        ...tx,
        gas,
      })
    )
  }

  async sendTransactionObject(
    txObj: TransactionObject<any>,
    tx?: Omit<Tx, 'data'>
  ): Promise<TransactionResult> {
    tx = this.fillTxDefaults(tx)
    tx = await this.fillGasPrice(tx)

    let gas = tx.gas
    if (gas == null) {
      const gasEstimator = (_tx: Tx) => txObj.estimateGas({ ..._tx })
      const getCallTx = (_tx: Tx) => {
        // @ts-ignore missing _parent property from TransactionObject type.
        return { ..._tx, data: txObj.encodeABI(), to: txObj._parent._address }
      }
      const caller = (_tx: Tx) => this.web3.eth.call(getCallTx(_tx))
      try {
        gas = Math.round(
          (await estimateGas(tx, gasEstimator, caller)) * this.config.gasInflationFactor
        )
        debug('estimatedGas: %s', gas)
      } catch (e) {
        throw new Error(e)
      }
    }

    return toTxResult(
      txObj.send({
        ...tx,
        gas,
      })
    )
  }

  async signTypedData(signer: string, typedData: EIP712TypedData): Promise<Signature> {
    const signature = await new Promise<string>((resolve, reject) => {
      ;(this.web3.currentProvider as Pick<HttpProvider, 'send'>).send(
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

  private fillTxDefaults(tx?: Tx): Tx {
    const defaultTx: Tx = {
      from: this.config.from,
      feeCurrency: this.config.feeCurrency,
      gasPrice: this.config.gasPrice,
    }

    return {
      ...defaultTx,
      ...tx,
    }
  }

  async getEpochSize(): Promise<number> {
    const validators = await this.contracts.getValidators()
    const epochSize = await validators.getEpochSize()

    return epochSize.toNumber()
  }

  async getFirstBlockNumberForEpoch(epochNumber: number): Promise<number> {
    const epochSize = await this.getEpochSize()
    // Follows GetEpochFirstBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
    if (epochNumber === 0) {
      // No first block for epoch 0
      return 0
    }
    return (epochNumber - 1) * epochSize + 1
  }

  async getLastBlockNumberForEpoch(epochNumber: number): Promise<number> {
    const epochSize = await this.getEpochSize()
    // Follows GetEpochLastBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
    if (epochNumber === 0) {
      return 0
    }
    const firstBlockNumberForEpoch = await this.getFirstBlockNumberForEpoch(epochNumber)
    return firstBlockNumberForEpoch + (epochSize - 1)
  }

  async getEpochNumberOfBlock(blockNumber: number): Promise<number> {
    const epochSize = await this.getEpochSize()
    // Follows GetEpochNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
    const epochNumber = Math.floor(blockNumber / epochSize)
    if (blockNumber % epochSize === 0) {
      return epochNumber
    } else {
      return epochNumber + 1
    }
  }

  stop() {
    assertIsCeloProvider(this.web3.currentProvider)
    this.web3.currentProvider.stop()
  }
}
