import { Connection } from '@celo/connect'
import { AddressRegistry } from './address-registry'
import { CeloContract } from './base'
import { ContractCacheType } from './basic-contract-cache-type'
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
  [CeloContract.BlockchainParameters]: BlockchainParametersWrapper,
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
  [CeloContract.GrandaMento]: GrandaMentoWrapper,
  // [CeloContract.Random]: RandomWrapper,
  // [CeloContract.Registry]: RegistryWrapper,
  [CeloContract.MetaTransactionWallet]: MetaTransactionWalletWrapper,
  [CeloContract.MetaTransactionWalletDeployer]: MetaTransactionWalletDeployerWrapper,
  [CeloContract.MultiSig]: MultiSigWrapper,
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
  private wrapperCache: Partial<Record<CeloContract, any>> = {}
  constructor(
    readonly connection: Connection,
    readonly _web3Contracts: Web3ContractCache,
    readonly registry: AddressRegistry
  ) {}

  getAccounts(): Promise<AccountsWrapper> {
    return this.getContract(CeloContract.Accounts)
  }
  getAttestations(): Promise<AttestationsWrapper> {
    return this.getContract(CeloContract.Attestations)
  }
  getBlockchainParameters(): Promise<BlockchainParametersWrapper> {
    return this.getContract(CeloContract.BlockchainParameters)
  }
  getDoubleSigningSlasher(): Promise<DoubleSigningSlasherWrapper> {
    return this.getContract<CeloContract.DoubleSigningSlasher>(CeloContract.DoubleSigningSlasher)
  }
  getDowntimeSlasher(): Promise<DowntimeSlasherWrapper> {
    return this.getContract(CeloContract.DowntimeSlasher)
  }
  getElection(): Promise<ElectionWrapper> {
    return this.getContract(CeloContract.Election)
  }
  getEpochRewards(): Promise<EpochRewardsWrapper> {
    return this.getContract(CeloContract.EpochRewards)
  }
  getErc20<T extends Ierc20>(address: string): Promise<Erc20Wrapper<T>> {
    return this.getContract(CeloContract.ERC20, address)
  }
  getEscrow(): Promise<EscrowWrapper> {
    return this.getContract(CeloContract.Escrow)
  }

  getExchange(stableToken: StableToken = StableToken.cUSD): Promise<ExchangeWrapper> {
    return this.getContract(stableTokenInfos[stableToken].exchangeContract)
  }

  getFreezer(): Promise<FreezerWrapper> {
    return this.getContract(CeloContract.Freezer)
  }

  getGasPriceMinimum(): Promise<GasPriceMinimumWrapper> {
    return this.getContract(CeloContract.GasPriceMinimum)
  }
  getGoldToken(): Promise<GoldTokenWrapper> {
    return this.getContract(CeloContract.GoldToken)
  }
  getGovernance(): Promise<GovernanceWrapper> {
    return this.getContract(CeloContract.Governance)
  }
  getGrandaMento(): Promise<GrandaMentoWrapper> {
    return this.getContract(CeloContract.GrandaMento)
  }
  getLockedGold(): Promise<LockedGoldWrapper> {
    return this.getContract(CeloContract.LockedGold)
  }
  getMetaTransactionWallet(address: string): Promise<MetaTransactionWalletWrapper> {
    return this.getContract(CeloContract.MetaTransactionWallet, address)
  }
  getMetaTransactionWalletDeployer(address: string): Promise<MetaTransactionWalletDeployerWrapper> {
    return this.getContract(CeloContract.MetaTransactionWalletDeployer, address)
  }
  getMultiSig(address: string): Promise<MultiSigWrapper> {
    return this.getContract(CeloContract.MultiSig, address)
  }
  getReserve(): Promise<ReserveWrapper> {
    return this.getContract(CeloContract.Reserve)
  }
  getSortedOracles(): Promise<SortedOraclesWrapper> {
    return this.getContract(CeloContract.SortedOracles)
  }

  getStableToken(stableToken: StableToken = StableToken.cUSD): Promise<StableTokenWrapper> {
    return this.getContract(stableTokenInfos[stableToken].contract)
  }
  getValidators(): Promise<ValidatorsWrapper> {
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

        this.wrapperCache[contract] = new Klass(this.connection, instance as any, this.registry)
      } else if (contractsWhichRequireCache.has(contract)) {
        const contractName = contract as keyof WrapperFactoriesWhichNeedCacheType
        const Klass = WrapperFactoriesWhichNeedCache[contractName]
        this.wrapperCache[contract] = new Klass(this.connection, instance as any, this)
      } else {
        const Klass = WrapperFactories[contract as keyof CFType]
        this.wrapperCache[contract] = new Klass(this.connection, instance as any)
      }
    }
    return this.wrapperCache[contract]!
  }

  public invalidateContract<C extends CeloContract>(contract: C) {
    this._web3Contracts.invalidateContract(contract)
    this.wrapperCache[contract] = null
  }
}
