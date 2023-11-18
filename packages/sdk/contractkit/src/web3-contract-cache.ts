// tslint:disable: ordered-imports
import debugFactory from 'debug'
import { AddressRegistry } from './address-registry'
import { CeloContract, ProxyContracts } from './base'
import { StableToken } from './celo-tokens'
import { newGasPriceMinimum } from './generated/0.8/GasPriceMinimum'
import { newAccounts } from './generated/Accounts'
import { newAttestations } from './generated/Attestations'
import { newBlockchainParameters } from './generated/BlockchainParameters'
import { newDoubleSigningSlasher } from './generated/DoubleSigningSlasher'
import { newDowntimeSlasher } from './generated/DowntimeSlasher'
import { newElection } from './generated/Election'
import { newEpochRewards } from './generated/EpochRewards'
import { newEscrow } from './generated/Escrow'
import { newFederatedAttestations } from './generated/FederatedAttestations'
import { newFeeCurrencyWhitelist } from './generated/FeeCurrencyWhitelist'
import { newFeeHandler } from './generated/FeeHandler'
import { newFreezer } from './generated/Freezer'
import { newGoldToken } from './generated/GoldToken'
import { newGovernance } from './generated/Governance'
import { newIERC20 } from './generated/IERC20'
import { newLockedGold } from './generated/LockedGold'
import { newMetaTransactionWallet } from './generated/MetaTransactionWallet'
import { newMetaTransactionWalletDeployer } from './generated/MetaTransactionWalletDeployer'
import { newMultiSig } from './generated/MultiSig'
import { newOdisPayments } from './generated/OdisPayments'
import { newProxy } from './generated/Proxy'
import { newRandom } from './generated/Random'
import { newRegistry } from './generated/Registry'
import { newSortedOracles } from './generated/SortedOracles'
import { newValidators } from './generated/Validators'
import { newExchange } from './generated/mento/Exchange'
import { newExchangeBRL } from './generated/mento/ExchangeBRL'
import { newExchangeEUR } from './generated/mento/ExchangeEUR'
import { newGrandaMento } from './generated/mento/GrandaMento'
import { newReserve } from './generated/mento/Reserve'
import { newStableToken } from './generated/mento/StableToken'

import { newMentoFeeHandlerSeller } from './generated/MentoFeeHandlerSeller'
import { newUniswapFeeHandlerSeller } from './generated/UniswapFeeHandlerSeller'

const debug = debugFactory('kit:web3-contract-cache')

export const ContractFactories = {
  [CeloContract.Accounts]: newAccounts,
  [CeloContract.Attestations]: newAttestations,
  [CeloContract.BlockchainParameters]: newBlockchainParameters,
  [CeloContract.DoubleSigningSlasher]: newDoubleSigningSlasher,
  [CeloContract.DowntimeSlasher]: newDowntimeSlasher,
  [CeloContract.Election]: newElection,
  [CeloContract.EpochRewards]: newEpochRewards,
  [CeloContract.ERC20]: newIERC20,
  [CeloContract.Escrow]: newEscrow,
  [CeloContract.Exchange]: newExchange,
  [CeloContract.ExchangeEUR]: newExchangeEUR,
  [CeloContract.ExchangeBRL]: newExchangeBRL,
  [CeloContract.FederatedAttestations]: newFederatedAttestations,
  [CeloContract.FeeCurrencyWhitelist]: newFeeCurrencyWhitelist,
  [CeloContract.Freezer]: newFreezer,
  [CeloContract.FeeHandler]: newFeeHandler,
  [CeloContract.MentoFeeHandlerSeller]: newMentoFeeHandlerSeller,
  [CeloContract.UniswapFeeHandlerSeller]: newUniswapFeeHandlerSeller,
  [CeloContract.GasPriceMinimum]: newGasPriceMinimum,
  [CeloContract.GoldToken]: newGoldToken,
  [CeloContract.Governance]: newGovernance,
  [CeloContract.GrandaMento]: newGrandaMento,
  [CeloContract.LockedGold]: newLockedGold,
  [CeloContract.MetaTransactionWallet]: newMetaTransactionWallet,
  [CeloContract.MetaTransactionWalletDeployer]: newMetaTransactionWalletDeployer,
  [CeloContract.MultiSig]: newMultiSig,
  [CeloContract.OdisPayments]: newOdisPayments,
  [CeloContract.Random]: newRandom,
  [CeloContract.Registry]: newRegistry,
  [CeloContract.Reserve]: newReserve,
  [CeloContract.SortedOracles]: newSortedOracles,
  [CeloContract.StableToken]: newStableToken,
  [CeloContract.StableTokenEUR]: newStableToken,
  [CeloContract.StableTokenBRL]: newStableToken,
  [CeloContract.Validators]: newValidators,
}

const StableToContract = {
  [StableToken.cEUR]: CeloContract.StableTokenEUR,
  [StableToken.cUSD]: CeloContract.StableToken,
  [StableToken.cREAL]: CeloContract.StableTokenBRL,
}

const StableToExchange = {
  [StableToken.cEUR]: CeloContract.ExchangeEUR,
  [StableToken.cUSD]: CeloContract.Exchange,
  [StableToken.cREAL]: CeloContract.ExchangeBRL,
}

export type CFType = typeof ContractFactories
type ContractCacheMap = { [K in keyof CFType]?: ReturnType<CFType[K]> }

/**
 * Native Web3 contracts factory and cache.
 *
 * Exposes accessors to all `CeloContract` web3 contracts.
 *
 * Mostly a private cache, kit users would normally use
 * a contract wrapper
 */
export class Web3ContractCache {
  private cacheMap: ContractCacheMap = {}
  /** core contract's address registry */
  constructor(readonly registry: AddressRegistry) {}
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
  getEpochRewards() {
    return this.getContract(CeloContract.EpochRewards)
  }
  getErc20(address: string) {
    return this.getContract(CeloContract.ERC20, address)
  }
  getEscrow() {
    return this.getContract(CeloContract.Escrow)
  }
  getExchange(stableToken: StableToken = StableToken.cUSD) {
    return this.getContract(StableToExchange[stableToken])
  }
  getFederatedAttestations() {
    return this.getContract(CeloContract.FederatedAttestations)
  }
  getFeeCurrencyWhitelist() {
    return this.getContract(CeloContract.FeeCurrencyWhitelist)
  }
  getFreezer() {
    return this.getContract(CeloContract.Freezer)
  }
  getFeeHandler() {
    return this.getContract(CeloContract.FeeHandler)
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
  getGrandaMento() {
    return this.getContract(CeloContract.GrandaMento)
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
  getOdisPayments() {
    return this.getContract(CeloContract.OdisPayments)
  }
  getRandom() {
    return this.getContract(CeloContract.Random)
  }
  getRegistry() {
    return this.getContract(CeloContract.Registry)
  }
  getReserve() {
    return this.getContract(CeloContract.Reserve)
  }
  getSortedOracles() {
    return this.getContract(CeloContract.SortedOracles)
  }
  getStableToken(stableToken: StableToken = StableToken.cUSD) {
    return this.getContract(StableToContract[stableToken])
  }
  getValidators() {
    return this.getContract(CeloContract.Validators)
  }

  /**
   * Get native web3 contract wrapper
   */
  async getContract<C extends keyof typeof ContractFactories>(contract: C, address?: string) {
    if (this.cacheMap[contract] == null || address !== undefined) {
      // core contract in the registry
      if (!address) {
        address = await this.registry.addressFor(contract)
      }
      debug('Initiating contract %s', contract)
      debug('is it included?', ProxyContracts.includes(contract))
      debug('is it included?', ProxyContracts.toString())
      const createFn = ProxyContracts.includes(contract) ? newProxy : ContractFactories[contract]
      this.cacheMap[contract] = createFn(
        this.registry.connection.web3,
        address
      ) as ContractCacheMap[C]
    }
    // we know it's defined (thus the !)
    return this.cacheMap[contract]!
  }

  public invalidateContract<C extends keyof typeof ContractFactories>(contract: C) {
    this.cacheMap[contract] = undefined
  }
}
