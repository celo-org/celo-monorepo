import {
  Address,
  CeloTx,
  CeloTxObject,
  Connection,
  ReadOnlyWallet,
  TransactionResult,
} from '@celo/connect'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
import { Signature } from '@celo/utils/lib/signatureUtils'
import { LocalWallet } from '@celo/wallet-local'
import { BigNumber } from 'bignumber.js'
import net from 'net'
import Web3 from 'web3'
import { AddressRegistry } from './address-registry'
import { CeloContract, CeloTokenContract } from './base'
import { CeloTokens, EachCeloToken } from './celo-tokens'
import { ValidWrappers, WrapperCache } from './contract-cache'
import { Web3ContractCache } from './web3-contract-cache'
import { AttestationsConfig } from './wrappers/Attestations'
import { BlockchainParametersConfig } from './wrappers/BlockchainParameters'
import { DowntimeSlasherConfig } from './wrappers/DowntimeSlasher'
import { ElectionConfig } from './wrappers/Election'
import { ExchangeConfig } from './wrappers/Exchange'
import { GasPriceMinimumConfig } from './wrappers/GasPriceMinimum'
import { GovernanceConfig } from './wrappers/Governance'
import { GrandaMentoConfig } from './wrappers/GrandaMento'
import { LockedGoldConfig } from './wrappers/LockedGold'
import { ReserveConfig } from './wrappers/Reserve'
import { SortedOraclesConfig } from './wrappers/SortedOracles'
import { StableTokenConfig } from './wrappers/StableTokenWrapper'
import { ValidatorsConfig } from './wrappers/Validators'

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
 * Creates a new instance of the `ContractKit` with a web3 instance
 * @param web3 Web3 instance
 */
export function newKitFromWeb3(web3: Web3, wallet: ReadOnlyWallet = new LocalWallet()) {
  if (!web3.currentProvider) {
    throw new Error('Must have a valid Provider')
  }
  return new ContractKit(new Connection(web3, wallet))
}
export interface NetworkConfig {
  exchanges: EachCeloToken<ExchangeConfig>
  stableTokens: EachCeloToken<StableTokenConfig>
  election: ElectionConfig
  attestations: AttestationsConfig
  governance: GovernanceConfig
  lockedGold: LockedGoldConfig
  sortedOracles: SortedOraclesConfig
  gasPriceMinimum: GasPriceMinimumConfig
  reserve: ReserveConfig
  validators: ValidatorsConfig
  downtimeSlasher: DowntimeSlasherConfig
  blockchainParameters: BlockchainParametersConfig
  grandaMento: GrandaMentoConfig
}

interface AccountBalance extends EachCeloToken<BigNumber> {
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
  /** helper for interacting with CELO & stable tokens */
  readonly celoTokens: CeloTokens

  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  gasPriceSuggestionMultiplier = 5

  constructor(readonly connection: Connection) {
    this.registry = new AddressRegistry(this)
    this._web3Contracts = new Web3ContractCache(this)
    this.contracts = new WrapperCache(this)
    this.celoTokens = new CeloTokens(this)
  }

  getWallet() {
    return this.connection.wallet
  }

  async getTotalBalance(address: string): Promise<AccountBalance> {
    const lockedCelo = await this.contracts.getLockedGold()
    const lockedBalance = await lockedCelo.getAccountTotalLockedGold(address)
    let pending = new BigNumber(0)
    try {
      pending = await lockedCelo.getPendingWithdrawalsTotalValue(address)
    } catch (err) {
      // Just means that it's not an account
    }

    return {
      lockedCELO: lockedBalance,
      pending,
      ...(await this.celoTokens.balancesOf(address)),
    }
  }

  async getNetworkConfig(
    humanReadable = false
  ): Promise<NetworkConfig | Record<CeloContract & 'exchanges' & 'stableTokens', unknown>> {
    const configContracts: ValidWrappers[] = [
      CeloContract.Election,
      CeloContract.Attestations,
      CeloContract.Governance,
      CeloContract.LockedGold,
      CeloContract.SortedOracles,
      CeloContract.GasPriceMinimum,
      CeloContract.Reserve,
      CeloContract.Validators,
      CeloContract.DowntimeSlasher,
      CeloContract.BlockchainParameters,
      CeloContract.GrandaMento,
    ]

    const configMethod = async (contract: ValidWrappers) => {
      try {
        const configContractWrapper = await this.contracts.getContract(contract)
        if (humanReadable && 'getHumanReadableConfig' in configContractWrapper) {
          return configContractWrapper.getHumanReadableConfig()
        } else if ('getConfig' in configContractWrapper) {
          return configContractWrapper.getConfig()
        } else {
          throw new Error('No config endpoint found')
        }
      } catch (e) {
        return new Error(`Failed to fetch config for contract ${contract}: \n${e}`)
      }
    }

    const configArray = await Promise.all(configContracts.map(configMethod))

    const configMap: {
      [C in CeloContract]?: ReturnType<typeof configMethod> extends Promise<infer U> ? U : never
    } = {}
    configArray.forEach((config, index) => (configMap[configContracts[index]] = config))

    return {
      exchanges: await this.celoTokens.getExchangesConfigs(humanReadable),
      stableTokens: await this.celoTokens.getStablesConfigs(humanReadable),
      ...configMap,
    }
  }

  getHumanReadableNetworkConfig = () => this.getNetworkConfig(true)

  /**
   * Set CeloToken to use to pay for gas fees
   * @param tokenContract CELO (GoldToken) or a supported StableToken contract
   */
  async setFeeCurrency(tokenContract: CeloTokenContract): Promise<void> {
    const address =
      tokenContract === CeloContract.GoldToken
        ? undefined
        : await this.registry.addressFor(tokenContract)
    if (address) {
      await this.updateGasPriceInConnectionLayer(address)
    }
    this.connection.defaultFeeCurrency = address
  }

  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  async updateGasPriceInConnectionLayer(currency: Address) {
    const gasPriceMinimum = await this.contracts.getGasPriceMinimum()
    const rawGasPrice = await gasPriceMinimum.getGasPriceMinimum(currency)
    const gasPrice = rawGasPrice.multipliedBy(this.gasPriceSuggestionMultiplier).toFixed()
    await this.connection.setGasPriceForCurrency(currency, gasPrice)
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

  // *** NOTICE ***
  // Next functions exists for backwards compatibility
  // These should be consumed via connection to avoid future deprecation issues

  addAccount(privateKey: string) {
    this.connection.addAccount(privateKey)
  }

  set defaultAccount(address: Address | undefined) {
    this.connection.defaultAccount = address
  }

  get defaultAccount(): Address | undefined {
    return this.connection.defaultAccount
  }

  set gasInflationFactor(factor: number) {
    this.connection.defaultGasInflationFactor = factor
  }

  get gasInflationFactor() {
    return this.connection.defaultGasInflationFactor
  }

  set gasPrice(price: number) {
    this.connection.defaultGasPrice = price
  }

  get gasPrice() {
    return this.connection.defaultGasPrice
  }

  set defaultFeeCurrency(address: Address | undefined) {
    this.connection.defaultFeeCurrency = address
  }

  get defaultFeeCurrency() {
    return this.connection.defaultFeeCurrency
  }

  isListening(): Promise<boolean> {
    return this.connection.isListening()
  }

  isSyncing(): Promise<boolean> {
    return this.connection.isSyncing()
  }

  async fillGasPrice(tx: CeloTx): Promise<CeloTx> {
    if (tx.feeCurrency && tx.gasPrice === '0') {
      await this.updateGasPriceInConnectionLayer(tx.feeCurrency)
    }
    return this.connection.fillGasPrice(tx)
  }

  async sendTransaction(tx: CeloTx): Promise<TransactionResult> {
    return this.connection.sendTransaction(tx)
  }

  async sendTransactionObject(
    txObj: CeloTxObject<any>,
    tx?: Omit<CeloTx, 'data'>
  ): Promise<TransactionResult> {
    return this.connection.sendTransactionObject(txObj, tx)
  }

  async signTypedData(signer: string, typedData: EIP712TypedData): Promise<Signature> {
    return this.connection.signTypedData(signer, typedData)
  }

  stop() {
    this.connection.stop()
  }

  get web3() {
    return this.connection.web3
  }
}
