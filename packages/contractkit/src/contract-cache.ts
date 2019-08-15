import { CeloContract } from './base'
import { ContractKit } from './kit'
import { BondedDepositsWrapper } from './wrappers/BondedDeposits'
import { ExchangeWrapper } from './wrappers/Exchange'
import { GoldTokenWrapper } from './wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from './wrappers/StableTokenWrapper'
import { ValidatorsWrapper } from './wrappers/Validators'

const WrapperFactories = {
  // [CeloContract.Attestations]: AttestationsWrapper,
  [CeloContract.BondedDeposits]: BondedDepositsWrapper,
  // [CeloContract.Escrow]: EscrowWrapper,
  [CeloContract.Exchange]: ExchangeWrapper,
  // [CeloContract.GasCurrencyWhitelist]: GasCurrencyWhitelistWrapper,
  // [CeloContract.GasPriceMinimum]: GasPriceMinimumWrapper,
  [CeloContract.GoldToken]: GoldTokenWrapper,
  // [CeloContract.Governance]: GovernanceWrapper,
  // [CeloContract.MultiSig]: MultiSigWrapper,
  // [CeloContract.Random]: RandomWrapper,
  // [CeloContract.Registry]: RegistryWrapper,
  // [CeloContract.Reserve]: ReserveWrapper,
  // [CeloContract.SortedOracles]: SortedOraclesWrapper,
  [CeloContract.StableToken]: StableTokenWrapper,
  [CeloContract.Validators]: ValidatorsWrapper,
}

type CFType = typeof WrapperFactories

interface WrapperCacheMap {
  // [CeloContract.Attestations]?: AttestationsWrapper,
  [CeloContract.BondedDeposits]?: BondedDepositsWrapper
  // [CeloContract.Escrow]?: EscrowWrapper,
  [CeloContract.Exchange]?: ExchangeWrapper
  // [CeloContract.GasCurrencyWhitelist]?: GasCurrencyWhitelistWrapper,
  // [CeloContract.GasPriceMinimum]?: GasPriceMinimumWrapper,
  [CeloContract.GoldToken]?: GoldTokenWrapper
  // [CeloContract.Governance]?: GovernanceWrapper,
  // [CeloContract.MultiSig]?: MultiSigWrapper,
  // [CeloContract.Random]?: RandomWrapper,
  // [CeloContract.Registry]?: RegistryWrapper,
  // [CeloContract.Reserve]?: ReserveWrapper,
  // [CeloContract.SortedOracles]?: SortedOraclesWrapper,
  [CeloContract.StableToken]?: StableTokenWrapper
  [CeloContract.Validators]?: ValidatorsWrapper
}

export class WrapperCache {
  // private wrapperCache: Map<CeloContract, any> = new Map()
  private wrapperCache: WrapperCacheMap = {}

  constructor(readonly kit: ContractKit) {}

  // getAttestations() {
  //   return this.getWrapper(CeloContract.Attestations, newAttestations)
  // }
  getBondedDeposits() {
    return this.getContract(CeloContract.BondedDeposits)
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
  // getGasPriceMinimum() {
  //   return this.getWrapper(CeloContract.GasPriceMinimum, newGasPriceMinimum)
  // }
  getGoldToken() {
    return this.getContract(CeloContract.GoldToken)
  }
  // getGovernance() {
  //   return this.getWrapper(CeloContract.Governance, newGovernance)
  // }
  // getMultiSig() {
  //   return this.getWrapper(CeloContract.MultiSig, newMultiSig)
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
  getStableToken() {
    return this.getContract(CeloContract.StableToken)
  }
  getValidators() {
    return this.getContract(CeloContract.Validators)
  }

  public async getContract<C extends keyof CFType>(contract: C) {
    if (this.wrapperCache[contract] == null) {
      const instance = await this.kit._web3Contracts.getContract(contract)
      const Klass: CFType[C] = WrapperFactories[contract]
      this.wrapperCache[contract] = new Klass(this.kit, instance as any) as any
    }
    return this.wrapperCache[contract]!
  }
}
