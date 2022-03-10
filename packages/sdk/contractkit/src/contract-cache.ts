import { Connection } from '@celo/connect'
import { AddressRegistry } from './address-registry'
import { CeloContract } from './base'
import { StableToken, stableTokenInfos } from './celo-tokens'
import { Ierc20 } from './generated/IERC20'
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
import { FreezerWrapper } from './wrappers/Freezer'
import { GasPriceMinimumWrapper } from './wrappers/GasPriceMinimum'
import { GoldTokenWrapper } from './wrappers/GoldTokenWrapper'
import { GovernanceWrapper } from './wrappers/Governance'
import { GrandaMentoWrapper } from './wrappers/GrandaMento'
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
  [CeloContract.EpochRewards]: EpochRewardsWrapper,
  [CeloContract.ERC20]: Erc20Wrapper,
  [CeloContract.Escrow]: EscrowWrapper,
  [CeloContract.Exchange]: ExchangeWrapper,
  [CeloContract.ExchangeEUR]: ExchangeWrapper,
  [CeloContract.ExchangeBRL]: ExchangeWrapper,
  // [CeloContract.FeeCurrencyWhitelist]: FeeCurrencyWhitelistWrapper,
  [CeloContract.Freezer]: FreezerWrapper,
  [CeloContract.GasPriceMinimum]: GasPriceMinimumWrapper,
  [CeloContract.GoldToken]: GoldTokenWrapper,
  [CeloContract.Governance]: GovernanceWrapper,
  [CeloContract.GrandaMento]: GrandaMentoWrapper,
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
  [CeloContract.StableTokenBRL]: StableTokenWrapper,
  [CeloContract.Validators]: ValidatorsWrapper,
}

type CFType = typeof WrapperFactories
export type ValidWrappers = keyof CFType

/**
 * Kit ContractWrappers factory & cache.
 *
 * Provides access to all contract wrappers for celo core contracts
 */

export class WrapperCache {
  private wrapperCache: Partial<Record<CeloContract, any>> = {}
  constructor(
    readonly connection: Connection,
    readonly _web3Contracts: Web3ContractCache,
    readonly registry: AddressRegistry
  ) {}

  getAccounts() {
    return this.getContract(CeloContract.Accounts) as Promise<AccountsWrapper>
  }
  getAttestations() {
    return this.getContract(CeloContract.Attestations) as Promise<AttestationsWrapper>
  }
  getBlockchainParameters() {
    return this.getContract(
      CeloContract.BlockchainParameters
    ) as Promise<BlockchainParametersWrapper>
  }
  getDoubleSigningSlasher() {
    return this.getContract(
      CeloContract.DoubleSigningSlasher
    ) as Promise<DoubleSigningSlasherWrapper>
  }
  getDowntimeSlasher() {
    return this.getContract(CeloContract.DowntimeSlasher) as Promise<DowntimeSlasherWrapper>
  }
  getElection() {
    return this.getContract(CeloContract.Election) as Promise<ElectionWrapper>
  }
  getEpochRewards() {
    return this.getContract(CeloContract.EpochRewards)
  }
  getErc20<T extends Ierc20>(address: string) {
    return this.getContract(CeloContract.ERC20, address) as Promise<Erc20Wrapper<T>>
  }
  getEscrow() {
    return this.getContract(CeloContract.Escrow) as Promise<EscrowWrapper>
  }

  getExchange(stableToken: StableToken = StableToken.cUSD) {
    return this.getContract(
      stableTokenInfos[stableToken].exchangeContract
    ) as Promise<ExchangeWrapper>
  }

  getFreezer() {
    return this.getContract(CeloContract.Freezer) as Promise<FreezerWrapper>
  }
  // getFeeCurrencyWhitelist() {
  //   return this.getWrapper(CeloContract.FeeCurrencyWhitelist, newFeeCurrencyWhitelist)
  // }
  getGasPriceMinimum() {
    return this.getContract(CeloContract.GasPriceMinimum) as Promise<GasPriceMinimumWrapper>
  }
  getGoldToken() {
    return this.getContract(CeloContract.GoldToken) as Promise<GoldTokenWrapper>
  }
  getGovernance() {
    return this.getContract(CeloContract.Governance) as Promise<GovernanceWrapper>
  }
  getGrandaMento() {
    return this.getContract(CeloContract.GrandaMento) as Promise<GrandaMentoWrapper>
  }
  getLockedGold() {
    return this.getContract(CeloContract.LockedGold) as Promise<LockedGoldWrapper>
  }
  getMetaTransactionWallet(address: string) {
    return this.getContract(
      CeloContract.MetaTransactionWallet,
      address
    ) as Promise<MetaTransactionWalletWrapper>
  }
  getMetaTransactionWalletDeployer(address: string) {
    return this.getContract(
      CeloContract.MetaTransactionWalletDeployer,
      address
    ) as Promise<MetaTransactionWalletDeployerWrapper>
  }
  getMultiSig(address: string) {
    return this.getContract(CeloContract.MultiSig, address) as Promise<MultiSigWrapper>
  }

  getReserve() {
    return this.getContract(CeloContract.Reserve) as Promise<ReserveWrapper>
  }
  getSortedOracles() {
    return this.getContract(CeloContract.SortedOracles) as Promise<SortedOraclesWrapper>
  }

  getStableToken(stableToken: StableToken = StableToken.cUSD) {
    return this.getContract(stableTokenInfos[stableToken].contract) as Promise<StableTokenWrapper>
  }
  getValidators() {
    return this.getContract(CeloContract.Validators) as Promise<ValidatorsWrapper>
  }

  private getThirdArgument(contract: CeloContract) {
    switch (contract) {
      case CeloContract.SortedOracles:
        return this.registry
      case CeloContract.Accounts:
      case CeloContract.DoubleSigningSlasher:
      case CeloContract.DowntimeSlasher:
      case CeloContract.Election:
      case CeloContract.Governance:
      case CeloContract.LockedGold:
      // case CeloContract.ReleaseGold weirdly missing from the enum?
      case CeloContract.Validators:
        return this
      default:
        return undefined
    }
  }

  /**
   * Get Contract wrapper
   */
  public async getContract<C extends ValidWrappers>(contract: C, address?: string) {
    if (this.wrapperCache[contract] == null || address !== undefined) {
      const instance = await this._web3Contracts.getContract(contract, address)
      const Klass: CFType[C] = WrapperFactories[contract]
      this.wrapperCache[contract] = new Klass(
        this.connection,
        instance as any,
        this.getThirdArgument(contract) as any
      ) as any
    }
    return this.wrapperCache[contract]!
  }

  public invalidateContract<C extends CeloContract>(contract: C) {
    this._web3Contracts.invalidateContract(contract)
    ;(this.wrapperCache[contract] as any) = null
  }
}
