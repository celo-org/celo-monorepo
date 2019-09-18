import { CeloContract } from './base'
import { ContractKit } from './kit'
import { AttestationsWrapper } from './wrappers/Attestations'
import { ExchangeWrapper } from './wrappers/Exchange'
import { GasPriceMinimumWrapper } from './wrappers/GasPriceMinimum'
import { GoldTokenWrapper } from './wrappers/GoldTokenWrapper'
import { GovernanceWrapper } from './wrappers/Governance'
import { LockedGoldWrapper } from './wrappers/LockedGold'
import { ReserveWrapper } from './wrappers/Reserve'
import { SortedOraclesWrapper } from './wrappers/SortedOracles'
import { StableTokenWrapper } from './wrappers/StableTokenWrapper'
import { ValidatorsWrapper } from './wrappers/Validators'

const WrapperFactories = {
  [CeloContract.Attestations]: AttestationsWrapper,
  [CeloContract.LockedGold]: LockedGoldWrapper,
  // [CeloContract.Escrow]: EscrowWrapper,
  [CeloContract.Exchange]: ExchangeWrapper,
  // [CeloContract.GasCurrencyWhitelist]: GasCurrencyWhitelistWrapper,
  [CeloContract.GasPriceMinimum]: GasPriceMinimumWrapper,
  [CeloContract.GoldToken]: GoldTokenWrapper,
  [CeloContract.Governance]: GovernanceWrapper,
  // [CeloContract.MultiSig]: MultiSigWrapper,
  // [CeloContract.Random]: RandomWrapper,
  // [CeloContract.Registry]: RegistryWrapper,
  [CeloContract.Reserve]: ReserveWrapper,
  [CeloContract.SortedOracles]: SortedOraclesWrapper,
  [CeloContract.StableToken]: StableTokenWrapper,
  [CeloContract.Validators]: ValidatorsWrapper,
}

type CFType = typeof WrapperFactories
export type ValidWrappers = keyof CFType

interface WrapperCacheMap {
  [CeloContract.Attestations]?: AttestationsWrapper
  [CeloContract.LockedGold]?: LockedGoldWrapper
  // [CeloContract.Escrow]?: EscrowWrapper,
  [CeloContract.Exchange]?: ExchangeWrapper
  // [CeloContract.GasCurrencyWhitelist]?: GasCurrencyWhitelistWrapper,
  [CeloContract.GasPriceMinimum]?: GasPriceMinimumWrapper
  [CeloContract.GoldToken]?: GoldTokenWrapper
  [CeloContract.Governance]?: GovernanceWrapper
  // [CeloContract.MultiSig]?: MultiSigWrapper,
  // [CeloContract.Random]?: RandomWrapper,
  // [CeloContract.Registry]?: RegistryWrapper,
  [CeloContract.Reserve]?: ReserveWrapper
  [CeloContract.SortedOracles]?: SortedOraclesWrapper
  [CeloContract.StableToken]?: StableTokenWrapper
  [CeloContract.Validators]?: ValidatorsWrapper
}

export class WrapperCache {
  // private wrapperCache: Map<CeloContract, any> = new Map()
  private wrapperCache: WrapperCacheMap = {}

  constructor(readonly kit: ContractKit) {}

  getAttestations() {
    return this.getContract(CeloContract.Attestations)
  }
  getLockedGold() {
    return this.getContract(CeloContract.LockedGold)
  }
  // getEscrow() {
  //   return this.getWrapper(CeloContract.Escrow, newEscrow)
  // }
  getExchange() {
    return this.getContract(CeloContract.Exchange)
  }
  // getGasCurrencyWhitelist() {
  //   return this.getWrapper(CeloContract.GasCurrencyWhitelist, newGasCurrencyWhitelist)
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
  // getMultiSig() {
  //   return this.getWrapper(CeloContract.MultiSig, newMultiSig)
  // }
  // getRegistry() {
  //   return this.getWrapper(CeloContract.Registry, newRegistry)
  // }
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

  public async getContract<C extends ValidWrappers>(contract: C) {
    if (this.wrapperCache[contract] == null) {
      const instance = await this.kit._web3Contracts.getContract(contract)
      const Klass: CFType[C] = WrapperFactories[contract]
      this.wrapperCache[contract] = new Klass(this.kit, instance as any) as any
    }
    return this.wrapperCache[contract]!
  }
}
