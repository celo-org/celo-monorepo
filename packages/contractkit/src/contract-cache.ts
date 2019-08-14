import { CeloContract } from 'src/base'
import { ContractKit } from 'src/kit'
import { BondedDepositsWrapper } from 'src/wrappers/BondedDeposits'
import { ExchangeWrapper } from 'src/wrappers/Exchange'
import { GoldTokenWrapper } from 'src/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from 'src/wrappers/StableTokenWrapper'
import { ValidatorsWrapper } from 'src/wrappers/Validators'

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

type WrapperCacheMap = {
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
