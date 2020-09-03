import { Address, NodeCommunicationWrapper, ReadOnlyWallet } from '@celo/communication'
import { BigNumber } from 'bignumber.js'
import Web3 from 'web3'
import { AddressRegistry } from './address-registry'
import { CeloContract, CeloToken } from './base'
import { WrapperCache } from './contract-cache'
import { Web3ContractCache } from './web3-contract-cache'
import { AttestationsConfig } from './wrappers/Attestations'
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

/**
 * Creates a new instance of the `ContractKit` with a web3 instance
 * @param web3 Web3 instance
 */
export function newKitFromWeb3(web3: Web3, wallet?: ReadOnlyWallet) {
  if (!web3.currentProvider) {
    throw new Error('Must have a valid Provider')
  }
  return new ContractKit(new NodeCommunicationWrapper(web3, wallet))
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

  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  gasPriceSuggestionMultiplier = 5

  constructor(readonly communication: NodeCommunicationWrapper) {
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
    }
  }

  // For backwards compatibility
  set defaultAccount(address: Address | undefined) {
    this.communication.defaultAccount = address
  }

  /**
   * Set CeloToken to use to pay for gas fees
   * @param token cUSD (StableToken) or CELO (GoldToken)
   */
  async setFeeCurrency(token: CeloToken): Promise<void> {
    const address =
      token === CeloContract.GoldToken ? undefined : await this.registry.addressFor(token)
    await this.communication.setFeeCurrency(address)
  }

  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  async updateGasPriceInCommunicationLayer(currency: Address) {
    const gasPriceMinimum = await this.contracts.getGasPriceMinimum()
    const rawGasPrice = await gasPriceMinimum.getGasPriceMinimum(currency)
    const gasPrice = rawGasPrice.multipliedBy(this.gasPriceSuggestionMultiplier).toFixed()
    await this.communication.setGasPriceForCurrency(currency, gasPrice)
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
}
