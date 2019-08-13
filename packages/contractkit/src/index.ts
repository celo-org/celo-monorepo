import Web3 from 'web3'

export { Address, CeloContract } from 'src/base'
export * from 'src/kit'
export { newAttestations } from './generated/Attestations'
export { newBondedDeposits } from './generated/BondedDeposits'
export { newEscrow } from './generated/Escrow'
export { newExchange } from './generated/Exchange'
export { newGasCurrencyWhitelist } from './generated/GasCurrencyWhitelist'
export { newGasPriceMinimum } from './generated/GasPriceMinimum'
export { newGoldToken } from './generated/GoldToken'
export { newGovernance } from './generated/Governance'
export { newMultiSig } from './generated/MultiSig'
export { newRandom } from './generated/Random'
export { newRegistry } from './generated/Registry'
export { newReserve } from './generated/Reserve'
export { newSortedOracles } from './generated/SortedOracles'
export { newStableToken } from './generated/StableToken'
export { newValidators } from './generated/Validators'

export function newWeb3(url: string) {
  return new Web3(url)
}
