import { CeloContract } from './base'
import { StableToken } from './celo-tokens'
import { Ierc20 } from './generated/IERC20'
import { ContractKit } from './kit'
import { AccountsWrapper } from './wrappers/Accounts'
import { AttestationsWrapper } from './wrappers/Attestations'
import { BlockchainParametersWrapper } from './wrappers/BlockchainParameters'
import { DoubleSigningSlasherWrapper } from './wrappers/DoubleSigningSlasher'
import { DowntimeSlasherWrapper } from './wrappers/DowntimeSlasher'
import { ElectionWrapper } from './wrappers/Election'
import { Erc20Wrapper } from './wrappers/Erc20Wrapper'
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
  [CeloContract.ERC20]: Erc20Wrapper,
  [CeloContract.Escrow]: EscrowWrapper,
  [CeloContract.Exchange]: ExchangeWrapper,
  [CeloContract.ExchangeEUR]: ExchangeWrapper,
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
  [CeloContract.StableTokenEUR]: StableTokenWrapper,
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
  [CeloContract.ERC20]?: Erc20Wrapper<Ierc20>
  [CeloContract.Escrow]?: EscrowWrapper
  [CeloContract.Exchange]?: ExchangeWrapper
  [CeloContract.ExchangeEUR]?: ExchangeWrapper
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
  [CeloContract.StableTokenEUR]?: StableTokenWrapper
  [CeloContract.Validators]?: ValidatorsWrapper
}

/**
 * Kit ContractWrappers factory & cache.
 *
 * Provides access to all contract wrappers for celo core contracts
 */
export class WrapperCache {
  private wrapperCache: WrapperCacheMap = {}

  constructor(readonly kit: ContractKit) {}

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
    return this.getContract(CeloContract.DoubleSigningSlasher)
  }
  getDowntimeSlasher() {
    return this.getContract(CeloContract.DowntimeSlasher)
  }
  getElection() {
    return this.getContract(CeloContract.Election)
  }
  // getEpochRewards() {
  //   return this.getContract(CeloContract.EpochRewards)
  // }
  getErc20(address: string) {
    return this.getContract(CeloContract.ERC20, address)
  }
  getEscrow() {
    return this.getContract(CeloContract.Escrow)
  }
  getExchange(stableToken: StableToken = StableToken.cUSD) {
    return this.getContract(this.kit.celoTokens.getExchangeContract(stableToken))
  }
  getFreezer() {
    return this.getContract(CeloContract.Freezer)
  }
  // getFeeCurrencyWhitelist() {
  //   return this.getWrapper(CeloContract.FeeCurrencyWhitelist, newFeeCurrencyWhitelist)
  // }
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
  getMetaTransactionWallet(address: string) {
    return this.getContract(CeloContract.MetaTransactionWallet, address)
  }
  getMetaTransactionWalletDeployer(address: string) {
    return this.getContract(CeloContract.MetaTransactionWalletDeployer, address)
  }
  getMultiSig(address: string) {
    return this.getContract(CeloContract.MultiSig, address)
  }
  // getRegistry() {
  //   return this.getWrapper(CeloContract.Registry, newRegistry)
  // }
  getReserve() {
    return this.getContract(CeloContract.Reserve)
  }
  getSortedOracles() {
    return this.getContract(CeloContract.SortedOracles)
  }
  getStableToken(stableToken: StableToken = StableToken.cUSD) {
    return this.getContract(this.kit.celoTokens.getContract(stableToken))
  }
  getValidators() {
    return this.getContract(CeloContract.Validators)
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

  public invalidateContract<C extends ValidWrappers>(contract: C) {
    this.kit._web3Contracts.invalidateContract(contract)
    ;(this.wrapperCache[contract] as any) = null
  }
}
