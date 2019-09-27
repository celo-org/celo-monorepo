import Web3 from 'web3'
import { TransactionObject, Tx } from 'web3/eth/types'
import { AddressRegistry } from './address-registry'
import { Address, CeloContract, CeloToken } from './base'
import { WrapperCache } from './contract-cache'
import { sendTransaction, TxOptions } from './utils/send-tx'
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

export class ContractKit {
  readonly registry: AddressRegistry
  readonly _web3Contracts: Web3ContractCache
  readonly contracts: WrapperCache

  private _defaultOptions: TxOptions
  constructor(readonly web3: Web3) {
    this._defaultOptions = {
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
    this._defaultOptions.gasCurrency =
      token === CeloContract.GoldToken ? undefined : await this.registry.addressFor(token)
  }

  addAccount(privateKey: string) {
    addLocalAccount(this.web3, privateKey)
  }

  set defaultAccount(address: Address) {
    this._defaultOptions.from = address
    this.web3.eth.defaultAccount = address
  }

  get defaultAccount(): Address {
    return this.web3.eth.defaultAccount
  }

  get defaultOptions(): Readonly<TxOptions> {
    return { ...this._defaultOptions }
  }

  setGasCurrencyAddress(address: Address) {
    this._defaultOptions.gasCurrency = address
  }

  isListening(): Promise<boolean> {
    return this.web3.eth.net.isListening()
  }

  isSyncing(): Promise<boolean> {
    return this.web3.eth.isSyncing()
  }

  sendTransaction(tx: Tx): TransactionResult {
    const promiEvent = this.web3.eth.sendTransaction({
      from: this._defaultOptions.from,
      // TODO this won't work for locally signed TX
      gasPrice: '0',
      // @ts-ignore
      gasCurrency: this._defaultOptions.gasCurrency,
      // TODO needed for locally signed tx, ignored by now (celo-blockchain with set it)
      // gasFeeRecipient: this.defaultOptions.gasFeeRecipient,
      ...tx,
    })
    return toTxResult(promiEvent)
  }

  sendTransactionObject(
    txObj: TransactionObject<any>,
    options?: TxOptions
  ): Promise<TransactionResult> {
    return sendTransaction(txObj, {
      ...this._defaultOptions,
      ...options,
    })
  }
}
