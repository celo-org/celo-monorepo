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
import { ExchangeConfig } from './wrappers/Exchange'
import { GasPriceMinimumConfig } from './wrappers/GasPriceMinimum'
import { GovernanceConfig } from './wrappers/Governance'
import { LockedGoldConfig } from './wrappers/LockedGold'
import { ReserveConfig } from './wrappers/Reserve'
import { SortedOraclesConfig } from './wrappers/SortedOracles'
import { StableTokenConfig } from './wrappers/StableTokenWrapper'
import { ValidatorConfig } from './wrappers/Validators'

const debug = debugFactory('kit:kit')

export function newKit(url: string) {
  return newKitFromWeb3(new Web3(url))
}

export function newKitFromWeb3(web3: Web3) {
  return new ContractKit(web3)
}

export interface NetworkConfig {
  exchange: ExchangeConfig
  attestations: AttestationsConfig
  governance: GovernanceConfig
  lockedGold: LockedGoldConfig
  sortedOracles: SortedOraclesConfig
  gasPriceMinimum: GasPriceMinimumConfig
  reserve: ReserveConfig
  stableToken: StableTokenConfig
  validators: ValidatorConfig
}

export interface KitOptions {
  gasInflationFactor: number
  gasCurrency: Address | null
  from?: Address
}

export class ContractKit {
  readonly registry: AddressRegistry
  readonly _web3Contracts: Web3ContractCache
  readonly contracts: WrapperCache

  private config: KitOptions
  constructor(readonly web3: Web3) {
    this.config = {
      gasCurrency: null,
      gasInflationFactor: 1.3,
    }

    this.registry = new AddressRegistry(this)
    this._web3Contracts = new Web3ContractCache(this)
    this.contracts = new WrapperCache(this)
  }

  async getNetworkConfig(): Promise<NetworkConfig> {
    const token1 = await this.registry.addressFor(CeloContract.GoldToken)
    const token2 = await this.registry.addressFor(CeloContract.StableToken)
    const contracts = await Promise.all([
      this.contracts.getExchange(),
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
      contracts[1].getConfig([token1, token2]),
      contracts[2].getConfig(),
      contracts[3].getConfig(),
      contracts[4].getConfig(),
      contracts[5].getConfig(),
      contracts[6].getConfig(),
      contracts[7].getConfig(),
      contracts[8].getConfig(),
    ])
    return {
      exchange: res[0],
      attestations: res[1],
      governance: res[2],
      lockedGold: res[3],
      sortedOracles: res[4],
      gasPriceMinimum: res[5],
      reserve: res[6],
      stableToken: res[7],
      validators: res[8],
    }
  }

  async setGasCurrency(token: CeloToken) {
    this.config.gasCurrency =
      token === CeloContract.GoldToken ? null : await this.registry.addressFor(token)
  }

  addAccount(privateKey: string) {
    addLocalAccount(this.web3, privateKey)
  }

  set defaultAccount(address: Address) {
    this.config.from = address
    this.web3.eth.defaultAccount = address
  }

  get defaultAccount(): Address {
    return this.web3.eth.defaultAccount
  }

  set gasInflactionFactor(factor: number) {
    this.config.gasInflationFactor = factor
  }

  get gasInflationFactor() {
    return this.config.gasInflationFactor
  }

  set defaultGasCurrency(address: Address | null) {
    this.config.gasCurrency = address
  }

  get defaultGasCurrency() {
    return this.config.gasCurrency
  }

  isListening(): Promise<boolean> {
    return this.web3.eth.net.isListening()
  }

  isSyncing(): Promise<boolean> {
    return this.web3.eth.isSyncing()
  }

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

    if (this.config.gasCurrency) {
      defaultTx.gasCurrency = this.config.gasCurrency
    }

    return {
      ...defaultTx,
      ...tx,
    }
  }
}
