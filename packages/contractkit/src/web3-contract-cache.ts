import { CeloContract } from './base'
import { newAttestations } from './generated/Attestations'
import { newBondedDeposits } from './generated/BondedDeposits'
import { newEscrow } from './generated/Escrow'
import { newExchange } from './generated/Exchange'
import { newGasCurrencyWhitelist } from './generated/GasCurrencyWhitelist'
import { newGasPriceMinimum } from './generated/GasPriceMinimum'
import { newGoldToken } from './generated/GoldToken'
import { newGovernance } from './generated/Governance'
import { newMultiSig } from './generated/MultiSig'
import { newRandom } from './generated/Random'
import { newRegistry } from './generated/Registry'
import { newReserve } from './generated/Reserve'
import { newSortedOracles } from './generated/SortedOracles'
import { newStableToken } from './generated/StableToken'
import { newValidators } from './generated/Validators'
import { ContractKit } from './kit'

const ContractFactories = {
  [CeloContract.Attestations]: newAttestations,
  [CeloContract.BondedDeposits]: newBondedDeposits,
  [CeloContract.Escrow]: newEscrow,
  [CeloContract.Exchange]: newExchange,
  [CeloContract.GasCurrencyWhitelist]: newGasCurrencyWhitelist,
  [CeloContract.GasPriceMinimum]: newGasPriceMinimum,
  [CeloContract.GoldToken]: newGoldToken,
  [CeloContract.Governance]: newGovernance,
  [CeloContract.MultiSig]: newMultiSig,
  [CeloContract.Random]: newRandom,
  [CeloContract.Registry]: newRegistry,
  [CeloContract.Reserve]: newReserve,
  [CeloContract.SortedOracles]: newSortedOracles,
  [CeloContract.StableToken]: newStableToken,
  [CeloContract.Validators]: newValidators,
}

type CFType = typeof ContractFactories
type ContractCacheMap = { [K in keyof CFType]?: ReturnType<CFType[K]> }

export class Web3ContractCache {
  private cacheMap: ContractCacheMap = {}

  constructor(readonly kit: ContractKit) {}

  getAttestations() {
    return this.getContract(CeloContract.Attestations)
  }
  getBondedDeposits() {
    return this.getContract(CeloContract.BondedDeposits)
  }
  getEscrow() {
    return this.getContract(CeloContract.Escrow)
  }
  getExchange() {
    return this.getContract(CeloContract.Exchange)
  }
  getGasCurrencyWhitelist() {
    return this.getContract(CeloContract.GasCurrencyWhitelist)
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
  getMultiSig() {
    return this.getContract(CeloContract.MultiSig)
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
  getStableToken() {
    return this.getContract(CeloContract.StableToken)
  }
  getValidators() {
    return this.getContract(CeloContract.Validators)
  }

  async getContract<C extends CeloContract>(contract: C) {
    if (this.cacheMap[contract] == null) {
      const createFn = ContractFactories[contract] as CFType[C]
      this.cacheMap[contract] = createFn(
        this.kit.web3,
        await this.kit.registry.addressFor(contract)
      ) as NonNullable<ContractCacheMap[C]>
    }
    // we know it's defined (thus the !)
    return this.cacheMap[contract]!
  }
}
