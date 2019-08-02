// import * as fs from 'fs'
// import * as path from 'path'
import Web3 from 'web3'
// import Contract from 'web3/eth/contract'
import Attestations from '../contracts/Attestations'
import Escrow from '../contracts/Escrow'
import Exchange from '../contracts/Exchange'
import GasPriceMinimum from '../contracts/GasPriceMinimum'
import GoldToken from '../contracts/GoldToken'
// import { NETWORK_NAME } from '../contracts/network-name'
import Registry from '../contracts/Registry'
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
const REGISTRY_CONTRACT_ADDRESS = '0x000000000000000000000000000000000000ce10'
// Source for names: https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/lib/registry-utils.ts

// function getAbi(contractName: string): any {
//   const file = path.join(__dirname, `../.artifacts/build/${NETWORK_NAME}/contracts/${contractName}.json`)
//   const filedata: string = fs.readFileSync(file).toString()
//   const contractAbi = JSON.parse(filedata).abi
//   return contractAbi
// }

export async function getAddress(web3: Web3, contractName: string): Promise<string> {
  if (contractName === 'Registry') {
    return REGISTRY_CONTRACT_ADDRESS
  }
  const registry = await getRegistryContract(web3)
  return registry.methods.getAddressForOrDie(contractName).call()
}

// async function getContract(web3: Web3, contractName: string): Promise<Contract> {
//   const contractAbi = getAbi(contractName)
//   const contractAddress = await getAddress(web3, contractName)
//   return new web3.eth.Contract(contractAbi, contractAddress)
// }

export async function getRegistryContract(web3: Web3): Promise<RegistryType> {
  if (registryContract === null) {
    registryContract = await Registry(web3)
    // registryContract = (await getContract(web3, 'Registry')) as RegistryType
  }
  return registryContract
}

export async function getAttestationsContract(web3: Web3): Promise<AttestationsType> {
  if (attestationsContract === null) {
    attestationsContract = await Attestations(web3)
    //     attestationsContract = (await getContract(web3, 'Attestations')) as AttestationsType
  }
  return attestationsContract
}

export async function getExchangeContract(web3: Web3): Promise<ExchangeType> {
  if (exchangeContract === null) {
    try {
      exchangeContract = await Exchange(web3)
      //     exchangeContract = (await getContract(web3, 'Exchange')) as ExchangeType
    } catch (error) {
      throw new Error(`Fail to get Exchange contract ${error}`)
    }
  }
  return exchangeContract
}

export async function getEscrowContract(web3: Web3): Promise<EscrowType> {
  if (escrowContract === null) {
    escrowContract = await Escrow(web3)
    //     escrowContract = (await getContract(web3, 'Escrow')) as EscrowType
  }
  return escrowContract
}

export async function getGasPriceMinimumContract(web3: Web3): Promise<GasPriceMinimumType> {
  if (gasPriceMinimumContract === null) {
    gasPriceMinimumContract = await GasPriceMinimum(web3)
    //     gasPriceMinimumContract = (await getContract(web3, 'GasPriceMinimum')) as GasPriceMinimumType
  }
  return gasPriceMinimumContract
}

export async function getGoldTokenContract(web3: Web3): Promise<GoldTokenType> {
  if (goldTokenContract === null) {
    try {
      goldTokenContract = await GoldToken(web3)
      // goldTokenContract = (await getContract(web3, 'GoldToken')) as GoldTokenType
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
      // stableTokenContract = (await getContract(web3, 'StableToken')) as stableTokenType
    } catch (error) {
      throw new Error(`Fail to get StableToken contract ${error}`)
    }
  }
  return stableTokenContract
}
