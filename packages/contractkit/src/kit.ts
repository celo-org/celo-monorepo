import { BigNumber } from 'bignumber.js'
import debugFactory from 'debug'
import Web3 from 'web3'
import { TransactionObject, Tx } from 'web3/eth/types'
import { AddressRegistry } from './address-registry'
import { Address, CeloContract, CeloToken } from './base'
import { WrapperCache } from './contract-cache'
import { CeloProvider } from './providers/celo-provider'
import { toTxResult, TransactionResult } from './utils/tx-result'
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
  if (!web3.currentProvider) {
    throw new Error('Must have a valid Provider')
  }
  return new ContractKit(web3)
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
  constructor(readonly web3: Web3) {
    this.config = {
      feeCurrency: null,
      gasInflationFactor: 1.3,
    }
    if (!(web3.currentProvider instanceof CeloProvider)) {
      const celoProviderInstance = new CeloProvider(web3.currentProvider)
      web3.setProvider(celoProviderInstance)
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
    let pending = new BigNumber(0)
    try {
      pending = await lockedGold.getPendingWithdrawalsTotalValue(address)
    } catch (err) {
      // Just means that it's not an account
    }
    return {
      gold: goldBalance,
      lockedGold: lockedBalance,
      usd: dollarBalance,
      total: goldBalance
        .plus(lockedBalance)
        .plus(await exchange.quoteUsdSell(dollarBalance))
        .plus(pending),
      pending,
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
   * @param token cUSD (StableToken) or cGLD (GoldToken)
   */
  async setFeeCurrency(token: CeloToken): Promise<void> {
    this.config.feeCurrency =
      token === CeloContract.GoldToken ? null : await this.registry.addressFor(token)
  }

  addAccount(privateKey: string) {
    assertIsCeloProvider(this.web3.currentProvider)
    this.web3.currentProvider.addAccount(privateKey)
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
   * Set to `null` to use cGLD
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

  async getFirstBlockNumberForEpoch(epochNumber: number): Promise<number> {
    const validators = await this.contracts.getValidators()
    const epochSize = await validators.getEpochSize()
    // Follows GetEpochFirstBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
    if (epochNumber === 0) {
      // No first block for epoch 0
      return 0
    }
    return (epochNumber - 1) * epochSize.toNumber() + 1
  }

  async getLastBlockNumberForEpoch(epochNumber: number): Promise<number> {
    const validators = await this.contracts.getValidators()
    const epochSize = await validators.getEpochSize()
    // Follows GetEpochLastBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
    if (epochNumber === 0) {
      return 0
    }
    const firstBlockNumberForEpoch = await this.getFirstBlockNumberForEpoch(epochNumber)
    return firstBlockNumberForEpoch + (epochSize.toNumber() - 1)
  }

  async getEpochNumberOfBlock(blockNumber: number): Promise<number> {
    const validators = await this.contracts.getValidators()
    const epochSize = (await validators.getEpochSize()).toNumber()
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
