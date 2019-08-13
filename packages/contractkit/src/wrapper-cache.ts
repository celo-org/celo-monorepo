import { CeloContract } from 'src/base'
import { ContractKit } from 'src/kit'
import { BondedDepositsWrapper } from 'src/wrappers/BondedDeposits'
import { ValidatorsWrapper } from 'src/wrappers/Validators'

export class WrapperCache {
  private wrapperCache: Map<CeloContract, any> = new Map()

  constructor(readonly kit: ContractKit) {}

  // getAttestations() {
  //   return this.getWrapper(CeloContract.Attestations, newAttestations)
  // }
  getBondedDeposits() {
    return this.getWrapper(CeloContract.BondedDeposits, BondedDepositsWrapper)
  }
  // getEscrow() {
  //   return this.getWrapper(CeloContract.Escrow, newEscrow)
  // }
  // getExchange() {
  //   return this.getWrapper(CeloContract.Exchange, newExchange)
  // }
  // getGasCurrencyWhitelist() {
  //   return this.getWrapper(CeloContract.GasCurrencyWhitelist, newGasCurrencyWhitelist)
  // }
  // getGasPriceMinimum() {
  //   return this.getWrapper(CeloContract.GasPriceMinimum, newGasPriceMinimum)
  // }
  // getGoldToken() {
  //   return this.getWrapper(CeloContract.GoldToken, newGoldToken)
  // }
  // getGovernance() {
  //   return this.getWrapper(CeloContract.Governance, newGovernance)
  // }
  // getMultiSig() {
  //   return this.getWrapper(CeloContract.MultiSig, newMultiSig)
  // }
  // getRandom() {
  //   return this.getWrapper(CeloContract.Random, newRandom)
  // }
  // getRegistry() {
  //   return this.getWrapper(CeloContract.Registry, newRegistry)
  // }
  // getReserve() {
  //   return this.getWrapper(CeloContract.Reserve, newReserve)
  // }
  // getSortedOracles() {
  //   return this.getWrapper(CeloContract.SortedOracles, newSortedOracles)
  // }
  // getStableToken() {
  //   return this.getWrapper(CeloContract.StableToken, newStableToken)
  // }
  getValidators() {
    return this.getWrapper(CeloContract.Validators, ValidatorsWrapper)
  }

  private getWrapper<T>(contract: CeloContract, createFn: new (kit: ContractKit) => T): T {
    if (!this.wrapperCache.has(contract)) {
      const wrapperInstance = new createFn(this.kit)
      this.wrapperCache.set(contract, wrapperInstance)
    }
    return this.wrapperCache.get(contract)
  }
}
