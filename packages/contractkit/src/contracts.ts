import Web3 from 'web3'
import Attestations from '../contracts/Attestations'
import Escrow from '../contracts/Escrow'
import Exchange from '../contracts/Exchange'
import GasPriceMinimum from '../contracts/GasPriceMinimum'
import GoldToken from '../contracts/GoldToken'
import StableToken from '../contracts/StableToken'
import { Attestations as AttestationsType } from '../types/Attestations'
import { Escrow as EscrowType } from '../types/Escrow'
import { Exchange as ExchangeType } from '../types/Exchange'
import { GasPriceMinimum as GasPriceMinimumType } from '../types/GasPriceMinimum'
import { GoldToken as GoldTokenType } from '../types/GoldToken'
import { StableToken as StableTokenType } from '../types/StableToken'

let attestationsContract: AttestationsType | null = null
let escrowContract: EscrowType | null = null
let exchangeContract: ExchangeType | null = null
let gasPriceMinimumContract: GasPriceMinimumType | null = null
let goldTokenContract: GoldTokenType | null = null
let stableTokenContract: StableTokenType | null = null

export async function getAttestationsContract(web3: Web3): Promise<AttestationsType> {
  if (attestationsContract === null) {
    attestationsContract = await Attestations(web3)
  }
  return attestationsContract
}

export async function getABEContract() {
  return null
}

export async function getExchangeContract(web3: Web3): Promise<ExchangeType> {
  if (exchangeContract === null) {
    try {
      exchangeContract = await Exchange(web3)
    } catch (error) {
      throw new Error(`Fail to get Exchange contract ${error}`)
    }
  }
  return exchangeContract
}

export async function getEscrowContract(web3: Web3): Promise<EscrowType> {
  if (escrowContract === null) {
    escrowContract = await Escrow(web3)
  }
  return escrowContract
}

export async function getGasPriceMinimumContract(web3: Web3): Promise<GasPriceMinimumType> {
  if (gasPriceMinimumContract === null) {
    gasPriceMinimumContract = await GasPriceMinimum(web3)
  }
  return gasPriceMinimumContract
}

export async function getGoldTokenContract(web3: Web3): Promise<GoldTokenType> {
  if (goldTokenContract === null) {
    try {
      goldTokenContract = await GoldToken(web3)
    } catch (error) {
      throw new Error(`Fail to get GoldToken contract ${error}`)
    }
  }
  return goldTokenContract
}

export async function getStableTokenContract(web3: Web3): Promise<StableTokenType> {
  if (stableTokenContract === null) {
    try {
      stableTokenContract = await StableToken(web3)
    } catch (error) {
      throw new Error(`Fail to get StableToken contract ${error}`)
    }
  }
  return stableTokenContract
}
