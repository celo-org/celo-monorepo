import { Connection } from '@celo/connect'
import { AddressRegistry } from './address-registry'
import { CeloContract } from './base'
import { StableToken, stableTokenInfos } from './celo-tokens'
import { Ierc20 } from './generated/IERC20'
import { Web3ContractCache } from './web3-contract-cache'
import { AccountsWrapperType } from './wrappers/Accounts'
import { AttestationsWrapperType } from './wrappers/Attestations'
import { BlockchainParametersWrapperType } from './wrappers/BlockchainParameters'
import { DoubleSigningSlasherWrapperType } from './wrappers/DoubleSigningSlasher'
import { DowntimeSlasherWrapperType } from './wrappers/DowntimeSlasher'
import { ElectionWrapperType } from './wrappers/Election'
import { EpochRewardsWrapperType } from './wrappers/EpochRewards'
import { Erc20WrapperType } from './wrappers/Erc20Wrapper'
import { EscrowWrapperType } from './wrappers/Escrow'
import { ExchangeWrapperType } from './wrappers/Exchange'
import { FreezerWrapperType } from './wrappers/Freezer'
import { GasPriceMinimumWrapperType } from './wrappers/GasPriceMinimum'
import { GoldTokenWrapperType } from './wrappers/GoldTokenWrapper'
import { GovernanceWrapperType } from './wrappers/Governance'
import { GrandaMentoWrapperType } from './wrappers/GrandaMento'
import { LockedGoldWrapperType } from './wrappers/LockedGold'
import { MetaTransactionWalletWrapperType } from './wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapperType } from './wrappers/MetaTransactionWalletDeployer'
import { MultiSigWrapperType } from './wrappers/MultiSig'
import { ReserveWrapperType } from './wrappers/Reserve'
import { SortedOraclesWrapperType } from './wrappers/SortedOracles'
import { StableTokenWrapperType } from './wrappers/StableTokenWrapper'
import { ValidatorsWrapperType } from './wrappers/Validators'

const WrapperFactories = {
  [CeloContract.Accounts]: async () =>
    import('./wrappers/Accounts').then((mod) => mod.AccountsWrapper),
  [CeloContract.BlockchainParameters]: async () =>
    import('./wrappers/BlockchainParameters').then((mod) => mod.BlockchainParametersWrapper),
  [CeloContract.EpochRewards]: async () =>
    import('./wrappers/EpochRewards').then((mod) => mod.EpochRewardsWrapper),
  [CeloContract.ERC20]: async () =>
    import('./wrappers/Erc20Wrapper').then((mod) => mod.Erc20Wrapper),
  [CeloContract.Escrow]: async () => import('./wrappers/Escrow').then((mod) => mod.EscrowWrapper),
  [CeloContract.Exchange]: async () =>
    import('./wrappers/Exchange').then((mod) => mod.ExchangeWrapper),
  [CeloContract.ExchangeEUR]: async () =>
    import('./wrappers/Exchange').then((mod) => mod.ExchangeWrapper),
  [CeloContract.ExchangeBRL]: async () =>
    import('./wrappers/Exchange').then((mod) => mod.ExchangeWrapper),
  // [CeloContract.FeeCurrencyWhitelist]: FeeCurrencyWhitelistWrapper,
  [CeloContract.Freezer]: async () =>
    import('./wrappers/Freezer').then((mod) => mod.FreezerWrapper),
  [CeloContract.GasPriceMinimum]: async () =>
    import('./wrappers/GasPriceMinimum').then((mod) => mod.GasPriceMinimumWrapper),
  [CeloContract.GoldToken]: async () =>
    import('./wrappers/GoldTokenWrapper').then((mod) => mod.GoldTokenWrapper),
  [CeloContract.GrandaMento]: async () =>
    import('./wrappers/GrandaMento').then((mod) => mod.GrandaMentoWrapper),
  // [CeloContract.Random]: RandomWrapper,
  // [CeloContract.Registry]: RegistryWrapper,
  [CeloContract.MetaTransactionWallet]: async () =>
    import('./wrappers/MetaTransactionWallet').then((mod) => mod.MetaTransactionWalletWrapper),
  [CeloContract.MetaTransactionWalletDeployer]: async () =>
    import('./wrappers/MetaTransactionWalletDeployer').then(
      (mod) => mod.MetaTransactionWalletDeployerWrapper
    ),
  [CeloContract.MultiSig]: async () =>
    import('./wrappers/MultiSig').then((mod) => mod.MultiSigWrapper),
  [CeloContract.Reserve]: async () =>
    import('./wrappers/Reserve').then((mod) => mod.ReserveWrapper),
  [CeloContract.StableToken]: async () =>
    import('./wrappers/StableTokenWrapper').then((mod) => mod.StableTokenWrapper),
  [CeloContract.StableTokenEUR]: () =>
    import('./wrappers/StableTokenWrapper').then((mod) => mod.StableTokenWrapper),
  [CeloContract.StableTokenBRL]: () =>
    import('./wrappers/StableTokenWrapper').then((mod) => mod.StableTokenWrapper),
} as const

const WithRegistry = {
  [CeloContract.SortedOracles]: async () =>
    import('./wrappers/SortedOracles').then((mod) => mod.SortedOraclesWrapper),
} as const

const WrapperFactoriesWhichNeedCache = {
  [CeloContract.Attestations]: async () =>
    import('./wrappers/Attestations').then((mod) => mod.AttestationsWrapper),
  [CeloContract.DoubleSigningSlasher]: async () =>
    import('./wrappers/DoubleSigningSlasher').then((mod) => mod.DoubleSigningSlasherWrapper),
  [CeloContract.DowntimeSlasher]: async () =>
    import('./wrappers/DowntimeSlasher').then((mod) => mod.DowntimeSlasherWrapper),
  [CeloContract.Election]: async () =>
    import('./wrappers/Election').then((mod) => mod.ElectionWrapper),
  [CeloContract.Governance]: async () =>
    import('./wrappers/Governance').then((mod) => mod.GovernanceWrapper),
  [CeloContract.LockedGold]: async () =>
    import('./wrappers/LockedGold').then((mod) => mod.LockedGoldWrapper),
  [CeloContract.Validators]: async () =>
    import('./wrappers/Validators').then((mod) => mod.ValidatorsWrapper),
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
 */

export class WrapperCache {
  private wrapperCache: Partial<Record<CeloContract, any>> = {}
  constructor(
    readonly connection: Connection,
    readonly _web3Contracts: Web3ContractCache,
    readonly registry: AddressRegistry
  ) {}

  getAccounts(): Promise<AccountsWrapperType> {
    return this.getContract(CeloContract.Accounts)
  }
  getAttestations(): Promise<AttestationsWrapperType> {
    return this.getContract(CeloContract.Attestations)
  }
  getBlockchainParameters(): Promise<BlockchainParametersWrapperType> {
    return this.getContract(CeloContract.BlockchainParameters)
  }
  getDoubleSigningSlasher(): Promise<DoubleSigningSlasherWrapperType> {
    return this.getContract<CeloContract.DoubleSigningSlasher>(CeloContract.DoubleSigningSlasher)
  }
  getDowntimeSlasher(): Promise<DowntimeSlasherWrapperType> {
    return this.getContract(CeloContract.DowntimeSlasher)
  }
  getElection(): Promise<ElectionWrapperType> {
    return this.getContract(CeloContract.Election)
  }
  getEpochRewards(): Promise<EpochRewardsWrapperType> {
    return this.getContract(CeloContract.EpochRewards)
  }
  getErc20<T extends Ierc20>(address: string): Promise<Erc20WrapperType<T>> {
    return this.getContract(CeloContract.ERC20, address)
  }
  getEscrow(): Promise<EscrowWrapperType> {
    return this.getContract(CeloContract.Escrow)
  }

  getExchange(stableToken: StableToken = StableToken.cUSD): Promise<ExchangeWrapperType> {
    return this.getContract(stableTokenInfos[stableToken].exchangeContract)
  }

  getFreezer(): Promise<FreezerWrapperType> {
    return this.getContract(CeloContract.Freezer)
  }
  // getFeeCurrencyWhitelist() {
  //   return this.getWrapper(CeloContract.FeeCurrencyWhitelist, newFeeCurrencyWhitelist)
  // }
  getGasPriceMinimum(): Promise<GasPriceMinimumWrapperType> {
    return this.getContract(CeloContract.GasPriceMinimum)
  }
  getGoldToken(): Promise<GoldTokenWrapperType> {
    return this.getContract(CeloContract.GoldToken)
  }
  getGovernance(): Promise<GovernanceWrapperType> {
    return this.getContract(CeloContract.Governance)
  }
  getGrandaMento(): Promise<GrandaMentoWrapperType> {
    return this.getContract(CeloContract.GrandaMento)
  }
  getLockedGold(): Promise<LockedGoldWrapperType> {
    return this.getContract(CeloContract.LockedGold)
  }
  getMetaTransactionWallet(address: string): Promise<MetaTransactionWalletWrapperType> {
    return this.getContract(CeloContract.MetaTransactionWallet, address)
  }
  getMetaTransactionWalletDeployer(
    address: string
  ): Promise<MetaTransactionWalletDeployerWrapperType> {
    return this.getContract(CeloContract.MetaTransactionWalletDeployer, address)
  }
  getMultiSig(address: string): Promise<MultiSigWrapperType> {
    return this.getContract(CeloContract.MultiSig, address)
  }

  getReserve(): Promise<ReserveWrapperType> {
    return this.getContract(CeloContract.Reserve)
  }
  getSortedOracles(): Promise<SortedOraclesWrapperType> {
    return this.getContract(CeloContract.SortedOracles)
  }

  getStableToken(stableToken: StableToken = StableToken.cUSD): Promise<StableTokenWrapperType> {
    return this.getContract(stableTokenInfos[stableToken].contract)
  }
  getValidators(): Promise<ValidatorsWrapperType> {
    return this.getContract(CeloContract.Validators)
  }

  /**
   * Get Contract wrapper
   */
  public async getContract<C extends ValidWrappers>(contract: C, address?: string) {
    if (this.wrapperCache[contract] == null || address !== undefined) {
      const instance = await this._web3Contracts.getContract<C>(contract, address)
      if (contract === CeloContract.SortedOracles) {
        const getSortedOracles = WithRegistry[CeloContract.SortedOracles]
        const Klass = await getSortedOracles()
        this.wrapperCache[contract] = new Klass(this.connection, instance as any, this.registry)
      } else if (contractsWhichRequireCache.has(contract)) {
        let contractName = contract as keyof WrapperFactoriesWhichNeedCacheType
        const getClass = WrapperFactoriesWhichNeedCache[contractName]
        const Klass = await getClass()
        this.wrapperCache[contract] = new Klass(this.connection, instance as any, this)
      } else {
        const getClass = WrapperFactories[contract as keyof CFType]
        const Klass = await getClass()
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
