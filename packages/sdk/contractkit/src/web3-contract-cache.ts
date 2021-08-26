import debugFactory from 'debug'
import { CeloContract, ProxyContracts } from './base'
import { StableToken } from './celo-tokens'
import { newAccounts } from './generated/Accounts'
import { newAttestations } from './generated/Attestations'
import { newBlockchainParameters } from './generated/BlockchainParameters'
import { newDoubleSigningSlasher } from './generated/DoubleSigningSlasher'
import { newDowntimeSlasher } from './generated/DowntimeSlasher'
import { newElection } from './generated/Election'
import { newEpochRewards } from './generated/EpochRewards'
import { newEscrow } from './generated/Escrow'
import { newExchange } from './generated/Exchange'
import { newExchangeEur } from './generated/ExchangeEUR'
import { newFeeCurrencyWhitelist } from './generated/FeeCurrencyWhitelist'
import { newFreezer } from './generated/Freezer'
import { newGasPriceMinimum } from './generated/GasPriceMinimum'
import { newGoldToken } from './generated/GoldToken'
import { newGovernance } from './generated/Governance'
import { newGrandaMento } from './generated/GrandaMento'
import { newIerc20 } from './generated/IERC20'
import { newLockedGold } from './generated/LockedGold'
import { newMetaTransactionWallet } from './generated/MetaTransactionWallet'
import { newMetaTransactionWalletDeployer } from './generated/MetaTransactionWalletDeployer'
import { newMultiSig } from './generated/MultiSig'
import { newProxy } from './generated/Proxy'
import { newRandom } from './generated/Random'
import { newRegistry } from './generated/Registry'
import { newReserve } from './generated/Reserve'
import { newSortedOracles } from './generated/SortedOracles'
import { newStableToken } from './generated/StableToken'
import { newTransferWhitelist } from './generated/TransferWhitelist'
import { newValidators } from './generated/Validators'
import { ContractKit } from './kit'

const debug = debugFactory('kit:web3-contract-cache')

export const ContractFactories = {
  [CeloContract.Accounts]: newAccounts,
  [CeloContract.Attestations]: newAttestations,
  [CeloContract.BlockchainParameters]: newBlockchainParameters,
  [CeloContract.DoubleSigningSlasher]: newDoubleSigningSlasher,
  [CeloContract.DowntimeSlasher]: newDowntimeSlasher,
  [CeloContract.Election]: newElection,
  [CeloContract.EpochRewards]: newEpochRewards,
  [CeloContract.ERC20]: newIerc20,
  [CeloContract.Escrow]: newEscrow,
  [CeloContract.Exchange]: newExchange,
  [CeloContract.ExchangeEUR]: newExchangeEur,
  [CeloContract.FeeCurrencyWhitelist]: newFeeCurrencyWhitelist,
  [CeloContract.Freezer]: newFreezer,
  [CeloContract.GasPriceMinimum]: newGasPriceMinimum,
  [CeloContract.GoldToken]: newGoldToken,
  [CeloContract.Governance]: newGovernance,
  [CeloContract.GrandaMento]: newGrandaMento,
  [CeloContract.LockedGold]: newLockedGold,
  [CeloContract.MetaTransactionWallet]: newMetaTransactionWallet,
  [CeloContract.MetaTransactionWalletDeployer]: newMetaTransactionWalletDeployer,
  [CeloContract.MultiSig]: newMultiSig,
  [CeloContract.Random]: newRandom,
  [CeloContract.Registry]: newRegistry,
  [CeloContract.Reserve]: newReserve,
  [CeloContract.SortedOracles]: newSortedOracles,
  [CeloContract.StableToken]: newStableToken,
  [CeloContract.StableTokenEUR]: newStableToken,
  [CeloContract.TransferWhitelist]: newTransferWhitelist,
  [CeloContract.Validators]: newValidators,
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
    return this.getContract(this.kit.celoTokens.getExchangeContract(stableToken))
  }
  getFeeCurrencyWhitelist() {
    return this.getContract(CeloContract.FeeCurrencyWhitelist)
  }
  getFreezer() {
    return this.getContract(CeloContract.Freezer)
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
    return this.getContract(this.kit.celoTokens.getContract(stableToken))
  }
  getTransferWhitelist() {
    return this.getContract(CeloContract.TransferWhitelist)
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
        address = await this.kit.registry.addressFor(contract)
      }
      debug('Initiating contract %s', contract)
      const createFn = ProxyContracts.includes(contract) ? newProxy : ContractFactories[contract]
      this.cacheMap[contract] = createFn(this.kit.connection.web3, address) as ContractCacheMap[C]
    }
    // we know it's defined (thus the !)
    return this.cacheMap[contract]!
  }

  public invalidateContract<C extends keyof typeof ContractFactories>(contract: C) {
    this.cacheMap[contract] = undefined
  }
}
