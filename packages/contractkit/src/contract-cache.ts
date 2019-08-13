import { Address, CeloContract } from 'src/base'
import { newAttestations } from 'src/generated/Attestations'
import { newBondedDeposits } from 'src/generated/BondedDeposits'
import { newEscrow } from 'src/generated/Escrow'
import { newExchange } from 'src/generated/Exchange'
import { newGasCurrencyWhitelist } from 'src/generated/GasCurrencyWhitelist'
import { newGasPriceMinimum } from 'src/generated/GasPriceMinimum'
import { newGoldToken } from 'src/generated/GoldToken'
import { newGovernance } from 'src/generated/Governance'
import { newMultiSig } from 'src/generated/MultiSig'
import { newRandom } from 'src/generated/Random'
import { newRegistry } from 'src/generated/Registry'
import { newReserve } from 'src/generated/Reserve'
import { newSortedOracles } from 'src/generated/SortedOracles'
import { newStableToken } from 'src/generated/StableToken'
import { newValidators } from 'src/generated/Validators'
import { ContractKit } from 'src/kit'
import Web3 from 'web3'

export class ContractCache {
  private contractCache: Map<CeloContract, any> = new Map()

  constructor(readonly kit: ContractKit) {}

  getAttestations() {
    return this.getContract(CeloContract.Attestations, newAttestations)
  }
  getBondedDeposits() {
    return this.getContract(CeloContract.BondedDeposits, newBondedDeposits)
  }
  getEscrow() {
    return this.getContract(CeloContract.Escrow, newEscrow)
  }
  getExchange() {
    return this.getContract(CeloContract.Exchange, newExchange)
  }
  getGasCurrencyWhitelist() {
    return this.getContract(CeloContract.GasCurrencyWhitelist, newGasCurrencyWhitelist)
  }
  getGasPriceMinimum() {
    return this.getContract(CeloContract.GasPriceMinimum, newGasPriceMinimum)
  }
  getGoldToken() {
    return this.getContract(CeloContract.GoldToken, newGoldToken)
  }
  getGovernance() {
    return this.getContract(CeloContract.Governance, newGovernance)
  }
  getMultiSig() {
    return this.getContract(CeloContract.MultiSig, newMultiSig)
  }
  getRandom() {
    return this.getContract(CeloContract.Random, newRandom)
  }
  getRegistry() {
    return this.getContract(CeloContract.Registry, newRegistry)
  }
  getReserve() {
    return this.getContract(CeloContract.Reserve, newReserve)
  }
  getSortedOracles() {
    return this.getContract(CeloContract.SortedOracles, newSortedOracles)
  }
  getStableToken() {
    return this.getContract(CeloContract.StableToken, newStableToken)
  }
  getValidators() {
    return this.getContract(CeloContract.Validators, newValidators)
  }

  private async getContract<T>(
    contract: CeloContract,
    createFn: (web3: Web3, addr: Address) => T
  ): Promise<T> {
    if (!this.contractCache.has(contract)) {
      const contractInstance = createFn(this.kit.web3, await this.kit.registry.addressFor(contract))
      this.contractCache.set(contract, contractInstance)
    }
    return this.contractCache.get(contract)
  }
}
