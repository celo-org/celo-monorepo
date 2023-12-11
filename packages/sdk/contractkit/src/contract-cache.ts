import { IERC20 } from '@celo/abis/web3/IERC20'
import { Connection } from '@celo/connect'
import { AddressRegistry } from './address-registry'
import { CeloContract } from './base'
import { ContractCacheType } from './basic-contract-cache-type'
import { StableToken, stableTokenInfos } from './celo-tokens'
import { Web3ContractCache } from './web3-contract-cache'
import { AccountsWrapper } from './wrappers/Accounts'
import { AttestationsWrapper } from './wrappers/Attestations'
import { BlockchainParametersWrapper } from './wrappers/BlockchainParameters'
import { DoubleSigningSlasherWrapper } from './wrappers/DoubleSigningSlasher'
import { DowntimeSlasherWrapper } from './wrappers/DowntimeSlasher'
import { ElectionWrapper } from './wrappers/Election'
import { EpochRewardsWrapper } from './wrappers/EpochRewards'
import { Erc20Wrapper } from './wrappers/Erc20Wrapper'
import { EscrowWrapper } from './wrappers/Escrow'
import { ExchangeWrapper } from './wrappers/Exchange'
import { FederatedAttestationsWrapper } from './wrappers/FederatedAttestations'
import { FreezerWrapper } from './wrappers/Freezer'
import { GasPriceMinimumWrapper } from './wrappers/GasPriceMinimum'
import { GoldTokenWrapper } from './wrappers/GoldTokenWrapper'
import { GovernanceWrapper } from './wrappers/Governance'
import { LockedGoldWrapper } from './wrappers/LockedGold'
import { MultiSigWrapper } from './wrappers/MultiSig'
import { OdisPaymentsWrapper } from './wrappers/OdisPayments'
import { ReserveWrapper } from './wrappers/Reserve'
import { SortedOraclesWrapper } from './wrappers/SortedOracles'
import { StableTokenWrapper } from './wrappers/StableTokenWrapper'
import { ValidatorsWrapper } from './wrappers/Validators'

const WrapperFactories = {
  [CeloContract.Accounts]: AccountsWrapper,
  [CeloContract.BlockchainParameters]: BlockchainParametersWrapper,
  [CeloContract.EpochRewards]: EpochRewardsWrapper,
  [CeloContract.ERC20]: Erc20Wrapper,
  [CeloContract.Escrow]: EscrowWrapper,
  [CeloContract.Exchange]: ExchangeWrapper,
  [CeloContract.ExchangeEUR]: ExchangeWrapper,
  [CeloContract.ExchangeBRL]: ExchangeWrapper,
  [CeloContract.FederatedAttestations]: FederatedAttestationsWrapper,
  // [CeloContract.FeeCurrencyWhitelist]: FeeCurrencyWhitelistWrapper,
  [CeloContract.Freezer]: FreezerWrapper,
  [CeloContract.GasPriceMinimum]: GasPriceMinimumWrapper,
  [CeloContract.GoldToken]: GoldTokenWrapper,
  // [CeloContract.Random]: RandomWrapper,
  // [CeloContract.Registry]: RegistryWrapper,
  [CeloContract.MultiSig]: MultiSigWrapper,
  [CeloContract.OdisPayments]: OdisPaymentsWrapper,
  [CeloContract.Reserve]: ReserveWrapper,
  [CeloContract.StableToken]: StableTokenWrapper,
  [CeloContract.StableTokenEUR]: StableTokenWrapper,
  [CeloContract.StableTokenBRL]: StableTokenWrapper,
} as const

const WithRegistry = {
  [CeloContract.SortedOracles]: SortedOraclesWrapper,
} as const

const WrapperFactoriesWhichNeedCache = {
  [CeloContract.Attestations]: AttestationsWrapper,
  [CeloContract.DoubleSigningSlasher]: DoubleSigningSlasherWrapper,
  [CeloContract.DowntimeSlasher]: DowntimeSlasherWrapper,
  [CeloContract.Election]: ElectionWrapper,
  [CeloContract.Governance]: GovernanceWrapper,
  [CeloContract.LockedGold]: LockedGoldWrapper,
  [CeloContract.Validators]: ValidatorsWrapper,
}

type CFType = typeof WrapperFactories
type RegistryType = typeof WithRegistry
type WrapperFactoriesWhichNeedCacheType = typeof WrapperFactoriesWhichNeedCache
export type ValidWrappers =
  | keyof CFType
  | keyof RegistryType
  | keyof WrapperFactoriesWhichNeedCacheType

const contractsWhichRequireCache = new Set(Object.keys(WrapperFactoriesWhichNeedCache))

interface WrapperCacheMap {
  [CeloContract.Accounts]?: AccountsWrapper
  [CeloContract.Attestations]?: AttestationsWrapper
  [CeloContract.BlockchainParameters]?: BlockchainParametersWrapper
  [CeloContract.DoubleSigningSlasher]?: DoubleSigningSlasherWrapper
  [CeloContract.DowntimeSlasher]?: DowntimeSlasherWrapper
  [CeloContract.Election]?: ElectionWrapper
  [CeloContract.EpochRewards]?: EpochRewardsWrapper
  [CeloContract.ERC20]?: Erc20Wrapper<IERC20>
  [CeloContract.Escrow]?: EscrowWrapper
  [CeloContract.Exchange]?: ExchangeWrapper
  [CeloContract.ExchangeEUR]?: ExchangeWrapper
  [CeloContract.ExchangeBRL]?: ExchangeWrapper
  [CeloContract.FederatedAttestations]?: FederatedAttestationsWrapper
  // [CeloContract.FeeCurrencyWhitelist]?: FeeCurrencyWhitelistWrapper,
  [CeloContract.Freezer]?: FreezerWrapper
  [CeloContract.GasPriceMinimum]?: GasPriceMinimumWrapper
  [CeloContract.GoldToken]?: GoldTokenWrapper
  [CeloContract.Governance]?: GovernanceWrapper
  [CeloContract.LockedGold]?: LockedGoldWrapper
  [CeloContract.MultiSig]?: MultiSigWrapper
  [CeloContract.OdisPayments]?: OdisPaymentsWrapper
  // [CeloContract.Random]?: RandomWrapper,
  // [CeloContract.Registry]?: RegistryWrapper,
  [CeloContract.Reserve]?: ReserveWrapper
  [CeloContract.SortedOracles]?: SortedOraclesWrapper
  [CeloContract.StableToken]?: StableTokenWrapper
  [CeloContract.StableTokenEUR]?: StableTokenWrapper
  [CeloContract.StableTokenBRL]?: StableTokenWrapper
  [CeloContract.Validators]?: ValidatorsWrapper
}

/**
 * Kit ContractWrappers factory & cache.
 *
 * Provides access to all contract wrappers for celo core contracts
 *
 * @remarks
 *
 * Because it provides access to all contract wrappers it must load all wrappers and the contract ABIs for them
 * Consider Using {@link MiniWrapperCache}, building your own, or if you only need one Wrapper using it directly
 */

export class WrapperCache implements ContractCacheType {
  private wrapperCache: WrapperCacheMap = {}
  constructor(
    readonly connection: Connection,
    readonly _web3Contracts: Web3ContractCache,
    readonly registry: AddressRegistry
  ) {}

  getAccounts() {
    return this.getContract(CeloContract.Accounts)
  }
  getAttestations() {
    return this.getContract(CeloContract.Attestations)
  }
  getBlockchainParameters() {
    return this.getContract(CeloContract.BlockchainParameters)
  }
  getDoubleSigningSlasher() {
    return this.getContract<CeloContract.DoubleSigningSlasher>(CeloContract.DoubleSigningSlasher)
  }
  getDowntimeSlasher() {
    return this.getContract(CeloContract.DowntimeSlasher)
  }
  getElection() {
    return this.getContract(CeloContract.Election)
  }
  getEpochRewards() {
    return this.getContract(CeloContract.EpochRewards)
  }
  getErc20(address: string) {
    return this.getContract(CeloContract.ERC20, address)
  }
  getEscrow(): Promise<EscrowWrapper> {
    return this.getContract(CeloContract.Escrow)
  }
  getExchange(stableToken: StableToken = StableToken.cUSD) {
    return this.getContract(stableTokenInfos[stableToken].exchangeContract)
  }
  getFreezer() {
    return this.getContract(CeloContract.Freezer)
  }
  getFederatedAttestations() {
    return this.getContract(CeloContract.FederatedAttestations)
  }
  getGasPriceMinimum() {
    return this.getContract(CeloContract.GasPriceMinimum)
  }
  getGoldToken() {
    return this.getContract(CeloContract.GoldToken)
  }
  getGovernance() {
    return this.getContract(CeloContract.Governance)
  }
  getLockedGold() {
    return this.getContract(CeloContract.LockedGold)
  }
  getMultiSig(address: string) {
    return this.getContract(CeloContract.MultiSig, address)
  }
  getOdisPayments() {
    return this.getContract(CeloContract.OdisPayments)
  }
  getReserve() {
    return this.getContract(CeloContract.Reserve)
  }
  getSortedOracles() {
    return this.getContract(CeloContract.SortedOracles)
  }
  getStableToken(stableToken: StableToken = StableToken.cUSD) {
    return this.getContract(stableTokenInfos[stableToken].contract)
  }
  getValidators() {
    return this.getContract(CeloContract.Validators)
  }

  /**
   * Get Contract wrapper
   */
  public async getContract<C extends ValidWrappers>(contract: C, address?: string) {
    if (this.wrapperCache[contract] == null || address !== undefined) {
      const instance = await this._web3Contracts.getContract<C>(contract, address)
      if (contract === CeloContract.SortedOracles) {
        const Klass = WithRegistry[CeloContract.SortedOracles]
        this.wrapperCache[CeloContract.SortedOracles] = new Klass(
          this.connection,
          instance as any,
          this.registry
        )
      } else if (contractsWhichRequireCache.has(contract)) {
        const contractName = contract as keyof WrapperFactoriesWhichNeedCacheType
        const Klass = WrapperFactoriesWhichNeedCache[contractName]
        const wrapper = new Klass(this.connection, instance as any, this)
        this.wrapperCache[contractName] = wrapper as any
      } else {
        const simpleContractName = contract as keyof typeof WrapperFactories
        const Klass = WrapperFactories[simpleContractName]
        this.wrapperCache[simpleContractName] = new Klass(this.connection, instance as any) as any
      }
    }
    return this.wrapperCache[contract]!
  }

  public invalidateContract<C extends ValidWrappers>(contract: C) {
    this._web3Contracts.invalidateContract(contract)
    this.wrapperCache[contract] = undefined
  }
}
