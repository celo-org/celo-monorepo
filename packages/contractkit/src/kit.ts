import { BigNumber } from 'bignumber.js'
import debugFactory from 'debug'
import Web3 from 'web3'
import { TransactionObject, Tx } from 'web3/eth/types'
import { AddressRegistry } from './address-registry'
import { Address, CeloContract, CeloToken } from './base'
import { WrapperCache } from './contract-cache'
import { toTxResult, TransactionResult } from './utils/tx-result'
import { addLocalAccount } from './utils/web3-utils'
import { Web3ContractCache } from './web3-contract-cache'
import { AttestationsConfig } from './wrappers/Attestations'
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
 */
export function newKit(url: string) {
  return newKitFromWeb3(new Web3(url))
}

/**
 * Creates a new instance of `ContractKit` give a web3 instance
 * @param web3 Web3 instance
 */
export function newKitFromWeb3(web3: Web3) {
  return new ContractKit(web3)
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
}

export interface KitOptions {
  gasInflationFactor: number
  feeCurrency: Address | null
  from?: Address
}

interface AccountBalance {
  gold: BigNumber
  usd: BigNumber
  total: BigNumber
  lockedGold: BigNumber
}

export class ContractKit {
  /** core contract's address registry */
  readonly registry: AddressRegistry
  /** factory for core contract's native web3 wrappers  */
  readonly _web3Contracts: Web3ContractCache
  /** factory for core contract's kit wrappers  */
  readonly contracts: WrapperCache

  private config: KitOptions
  constructor(readonly web3: Web3) {
    this.config = {
      feeCurrency: null,
      gasInflationFactor: 1.3,
    }

    this.registry = new AddressRegistry(this)
    this._web3Contracts = new Web3ContractCache(this)
    this.contracts = new WrapperCache(this)
  }

  async getTotalBalance(address: string): Promise<AccountBalance> {
    const goldToken = await this.contracts.getGoldToken()
    const stableToken = await this.contracts.getStableToken()
    const lockedGold = await this.contracts.getLockedGold()
    const exchange = await this.contracts.getExchange()
    const goldBalance = await goldToken.balanceOf(address)
    const lockedBalance = await lockedGold.getAccountTotalLockedGold(address)
    const dollarBalance = await stableToken.balanceOf(address)
    return {
      gold: goldBalance,
      lockedGold: lockedBalance,
      usd: dollarBalance,
      total: goldBalance.plus(lockedBalance).plus(await exchange.quoteUsdSell(dollarBalance)),
    }
  }

  async getNetworkConfig(): Promise<NetworkConfig> {
    const token1 = await this.registry.addressFor(CeloContract.GoldToken)
    const token2 = await this.registry.addressFor(CeloContract.StableToken)
    const contracts = await Promise.all([
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
    ])
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
    }
  }

  /**
   * Set CeloToken to use to pay for gas fees
   * @param token cUsd or cGold
   */
  async setFeeCurrency(token: CeloToken): Promise<void> {
    this.config.feeCurrency =
      token === CeloContract.GoldToken ? null : await this.registry.addressFor(token)
  }

  addAccount(privateKey: string) {
    addLocalAccount(this.web3, privateKey)
  }

  /**
   * Set default account for generated transactions (eg. tx.from )
   */
  set defaultAccount(address: Address) {
    this.config.from = address
    this.web3.eth.defaultAccount = address
  }

  /**
   * Default account for generated transactions (eg. tx.from)
   */
  get defaultAccount(): Address {
    return this.web3.eth.defaultAccount
  }

  set gasInflationFactor(factor: number) {
    this.config.gasInflationFactor = factor
  }

  get gasInflationFactor() {
    return this.config.gasInflationFactor
  }

  /**
   * Set the ERC20 address for the token to use to pay for transaction fees.
   * The ERC20 must be whitelisted for gas.
   *
   * Set to `null` to use cGold
   *
   * @param address ERC20 address
   */
  set defaultFeeCurrency(address: Address | null) {
    this.config.feeCurrency = address
  }

  get defaultFeeCurrency() {
    return this.config.feeCurrency
  }

  isListening(): Promise<boolean> {
    return this.web3.eth.net.isListening()
  }

  isSyncing(): Promise<boolean> {
    return this.web3.eth.isSyncing()
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

    let gas = tx.gas
    if (gas == null) {
      gas = Math.round(
        (await this.web3.eth.estimateGas({ ...tx })) * this.config.gasInflationFactor
      )
      debug('estimatedGas: %s', gas)
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

    let gas = tx.gas
    if (gas == null) {
      gas = Math.round((await txObj.estimateGas({ ...tx })) * this.config.gasInflationFactor)
      debug('estimatedGas: %s', gas)
    }

    return toTxResult(
      txObj.send({
        ...tx,
        gas,
      })
    )
  }

  private fillTxDefaults(tx?: Tx): Tx {
    const defaultTx: Tx = {
      from: this.config.from,
      // gasPrice:0 means the node will compute gasPrice on it's own
      gasPrice: '0',
    }

    if (this.config.feeCurrency) {
      defaultTx.feeCurrency = this.config.feeCurrency
    }

    return {
      ...defaultTx,
      ...tx,
    }
  }

  /// TODO(jfoutts): correct epoch definitions below and elsewhere to match celo-blockchain istanbul
  async getFirstBlockNumberForEpoch(epochNumber: number): Promise<number> {
    const validators = await this.contracts.getValidators()
    const epochSize = await validators.getEpochSize()
    // Follows protocol/contracts getEpochNumber()
    return epochNumber * epochSize.toNumber() + 1
  }

  async getLastBlockNumberForEpoch(epochNumber: number): Promise<number> {
    const validators = await this.contracts.getValidators()
    const epochSize = await validators.getEpochSize()
    // Reverses protocol/contracts getEpochNumber()
    return (epochNumber + 1) * epochSize.toNumber()
  }

  async getEpochNumberOfBlock(blockNumber: number): Promise<number> {
    const validators = await this.contracts.getValidators()
    const epochSize = await validators.getEpochSize()
    // Follows protocol/contracts getEpochNumber()
    return Math.floor((blockNumber - 1) / epochSize.toNumber())
  }
}
