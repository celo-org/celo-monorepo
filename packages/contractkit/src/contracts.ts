import * as fs from 'fs'
import * as path from 'path'
import Web3 from 'web3'
import Attestations from '../contracts/Attestations'
import Escrow from '../contracts/Escrow'
import Exchange from '../contracts/Exchange'
import GasPriceMinimum from '../contracts/GasPriceMinimum'
import GoldToken from '../contracts/GoldToken'
import { NETWORK_NAME } from '../contracts/network-name'
import StableToken from '../contracts/StableToken'
import { Attestations as AttestationsType } from '../types/Attestations'
import { Escrow as EscrowType } from '../types/Escrow'
import { Exchange as ExchangeType } from '../types/Exchange'
import { GasPriceMinimum as GasPriceMinimumType } from '../types/GasPriceMinimum'
import { GoldToken as GoldTokenType } from '../types/GoldToken'
import { Registry as RegistryType } from '../types/Registry'
import { StableToken as StableTokenType } from '../types/StableToken'

let attestationsContract: AttestationsType | null = null
let escrowContract: EscrowType | null = null
let exchangeContract: ExchangeType | null = null
let gasPriceMinimumContract: GasPriceMinimumType | null = null
let goldTokenContract: GoldTokenType | null = null
let registryContract: RegistryType | null = null
let stableTokenContract: StableTokenType | null = null

// Registry contract is always pre-deployed to this address
const registryAddress = '0x000000000000000000000000000000000000ce10'

export async function getRegistryContract(web3: Web3): Promise<RegistryType> {
  if (registryContract === null) {
    console.info(`Dir is ${__dirname}`)
    const files = fs.readdirSync(path.join(__dirname, '..'))
    console.info(`files are ${files}`)
    const file = path.join(__dirname, `../.artifacts/build/${NETWORK_NAME}/contracts/Registry.json`)
    const filedata: string = fs.readFileSync(file).toString()
    const contractAbi = JSON.parse(filedata).abi
    registryContract = (await new web3.eth.Contract(contractAbi, registryAddress)) as RegistryType
  }
  return registryContract
}

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
