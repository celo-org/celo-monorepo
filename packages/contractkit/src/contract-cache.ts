import { CeloContract } from './base'
import { ContractKit } from './kit'
import { AccountsWrapper } from './wrappers/Accounts'
import { AttestationsWrapper } from './wrappers/Attestations'
import { BlockchainParametersWrapper } from './wrappers/BlockchainParameters'
import { DoubleSigningSlasherWrapper } from './wrappers/DoubleSigningSlasher'
import { DowntimeSlasherWrapper } from './wrappers/DowntimeSlasher'
import { ElectionWrapper } from './wrappers/Election'
// import { EpochRewardsWrapper } from './wrappers/EpochRewards'
import { EscrowWrapper } from './wrappers/Escrow'
import { ExchangeWrapper } from './wrappers/Exchange'
import { FreezerWrapper } from './wrappers/Freezer'
import { GasPriceMinimumWrapper } from './wrappers/GasPriceMinimum'
import { GoldTokenWrapper } from './wrappers/GoldTokenWrapper'
import { GovernanceWrapper } from './wrappers/Governance'
import { LockedGoldWrapper } from './wrappers/LockedGold'
import { MetaTransactionWalletWrapper } from './wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from './wrappers/MetaTransactionWalletDeployer'
import { MultiSigWrapper } from './wrappers/MultiSig'
import { ReserveWrapper } from './wrappers/Reserve'
import { SortedOraclesWrapper } from './wrappers/SortedOracles'
import { StableTokenWrapper } from './wrappers/StableTokenWrapper'
import { ValidatorsWrapper } from './wrappers/Validators'

const WrapperFactories = {
  [CeloContract.Accounts]: AccountsWrapper,
  [CeloContract.Attestations]: AttestationsWrapper,
  [CeloContract.BlockchainParameters]: BlockchainParametersWrapper,
  [CeloContract.DoubleSigningSlasher]: DoubleSigningSlasherWrapper,
  [CeloContract.DowntimeSlasher]: DowntimeSlasherWrapper,
  [CeloContract.Election]: ElectionWrapper,
  // [CeloContract.EpochRewards]?: EpochRewardsWrapper,
  [CeloContract.Escrow]: EscrowWrapper,
  [CeloContract.Exchange]: ExchangeWrapper,
  // [CeloContract.FeeCurrencyWhitelist]: FeeCurrencyWhitelistWrapper,
  [CeloContract.Freezer]: FreezerWrapper,
  [CeloContract.GasPriceMinimum]: GasPriceMinimumWrapper,
  [CeloContract.GoldToken]: GoldTokenWrapper,
  [CeloContract.Governance]: GovernanceWrapper,
  [CeloContract.LockedGold]: LockedGoldWrapper,
  // [CeloContract.Random]: RandomWrapper,
  // [CeloContract.Registry]: RegistryWrapper,
  [CeloContract.MetaTransactionWallet]: MetaTransactionWalletWrapper,
  [CeloContract.MetaTransactionWalletDeployer]: MetaTransactionWalletDeployerWrapper,
  [CeloContract.MultiSig]: MultiSigWrapper,
  [CeloContract.Reserve]: ReserveWrapper,
  [CeloContract.SortedOracles]: SortedOraclesWrapper,
  [CeloContract.StableToken]: StableTokenWrapper,
  [CeloContract.Validators]: ValidatorsWrapper,
}

type CFType = typeof WrapperFactories
export type ValidWrappers = keyof CFType

interface WrapperCacheMap {
  [CeloContract.Accounts]?: AccountsWrapper
  [CeloContract.Attestations]?: AttestationsWrapper
  [CeloContract.BlockchainParameters]?: BlockchainParametersWrapper
  [CeloContract.DoubleSigningSlasher]?: DoubleSigningSlasherWrapper
  [CeloContract.DowntimeSlasher]?: DowntimeSlasherWrapper
  [CeloContract.Election]?: ElectionWrapper
  // [CeloContract.EpochRewards]?: EpochRewardsWrapper
  [CeloContract.Escrow]?: EscrowWrapper
  [CeloContract.Exchange]?: ExchangeWrapper
  // [CeloContract.FeeCurrencyWhitelist]?: FeeCurrencyWhitelistWrapper,
  [CeloContract.Freezer]?: FreezerWrapper
  [CeloContract.GasPriceMinimum]?: GasPriceMinimumWrapper
  [CeloContract.GoldToken]?: GoldTokenWrapper
  [CeloContract.Governance]?: GovernanceWrapper
  [CeloContract.LockedGold]?: LockedGoldWrapper
  [CeloContract.MetaTransactionWallet]?: MetaTransactionWalletWrapper
  [CeloContract.MetaTransactionWalletDeployer]?: MetaTransactionWalletDeployerWrapper
  [CeloContract.MultiSig]?: MultiSigWrapper
  // [CeloContract.Random]?: RandomWrapper,
  // [CeloContract.Registry]?: RegistryWrapper,
  [CeloContract.Reserve]?: ReserveWrapper
  [CeloContract.SortedOracles]?: SortedOraclesWrapper
  [CeloContract.StableToken]?: StableTokenWrapper
  [CeloContract.Validators]?: ValidatorsWrapper
}

/**
 * Kit ContractWrappers factory & cache.
 *
 * Provides access to all contract wrappers for celo core contracts
 */
export class WrapperCache {
  // private wrapperCache: Map<CeloContract, any> = new Map()
  private wrapperCache: WrapperCacheMap = {}

  constructor(readonly kit: ContractKit) {}

  getAccounts(address?: string) {
    return this.getContract(CeloContract.Accounts, address)
  }
  getAttestations(address?: string) {
    return this.getContract(CeloContract.Attestations, address)
  }
  getBlockchainParameters(address?: string) {
    return this.getContract(CeloContract.BlockchainParameters, address)
  }
  getDoubleSigningSlasher(address?: string) {
    return this.getContract(CeloContract.DoubleSigningSlasher, address)
  }
  getDowntimeSlasher(address?: string) {
    return this.getContract(CeloContract.DowntimeSlasher, address)
  }
  getElection(address?: string) {
    return this.getContract(CeloContract.Election, address)
  }
  // getEpochRewards(address?: string) {
  //   return this.getContract(CeloContract.EpochRewards, address)
  // }
  getEscrow(address?: string) {
    return this.getContract(CeloContract.Escrow, address)
  }
  getExchange(address?: string) {
    return this.getContract(CeloContract.Exchange, address)
  }
  getFreezer(address?: string) {
    return this.getContract(CeloContract.Freezer, address)
  }
  // getFeeCurrencyWhitelist(address?: string) {
  //   return this.getWrapper(CeloContract.FeeCurrencyWhitelist, newFeeCurrencyWhitelist, address)
  // }
  getGasPriceMinimum(address?: string) {
    return this.getContract(CeloContract.GasPriceMinimum, address)
  }
  getGoldToken(address?: string) {
    return this.getContract(CeloContract.GoldToken, address)
  }
  getGovernance(address?: string) {
    return this.getContract(CeloContract.Governance, address)
  }
  getLockedGold(address?: string) {
    return this.getContract(CeloContract.LockedGold, address)
  }
  getMetaTransactionWallet(address: string) {
    return this.getContract(CeloContract.MetaTransactionWallet, address)
  }
  getMetaTransactionWalletDeployer(address: string) {
    return this.getContract(CeloContract.MetaTransactionWalletDeployer, address)
  }
  getMultiSig(address: string) {
    return this.getContract(CeloContract.MultiSig, address)
  }
  // getRegistry(address?: string) {
  //   return this.getWrapper(CeloContract.Registry, newRegistry, address)
  // }
  getReserve(address?: string) {
    return this.getContract(CeloContract.Reserve, address)
  }
  getSortedOracles(address?: string) {
    return this.getContract(CeloContract.SortedOracles, address)
  }
  getStableToken(address?: string) {
    return this.getContract(CeloContract.StableToken, address)
  }
  getValidators(address?: string) {
    return this.getContract(CeloContract.Validators, address)
  }

  /**
   * Get Contract wrapper
   */
  public async getContract<C extends ValidWrappers>(contract: C, address?: string) {
    if (this.wrapperCache[contract] == null || address !== undefined) {
      const instance = await this.kit._web3Contracts.getContract(contract, address)
      const Klass: CFType[C] = WrapperFactories[contract]
      this.wrapperCache[contract] = new Klass(this.kit, instance as any) as any
    }
    return this.wrapperCache[contract]!
  }
}
