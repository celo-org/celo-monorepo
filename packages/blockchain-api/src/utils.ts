/* tslint:disable:no-console */
import { CeloContract, ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'
import { WEB3_PROVIDER_URL } from './config'

// to get rid of 18 extra 0s in the values
export const WEI_PER_GOLD = Math.pow(10, 18)

export function randomTimestamp() {
  const start = new Date(2018, 0, 1)
  const end = new Date()
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

export function randomAddr() {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let randomString = '0x'
  let randomPoz
  for (let i = 0; i < 40; i++) {
    randomPoz = Math.floor(Math.random() * charSet.length)
    randomString += charSet.substring(randomPoz, randomPoz + 1)
  }
  return randomString
}

// Returns date string in YYYY-MM-DD
export function formatDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

export enum Contracts {
  Attestations = 'Attestations',
  Escrow = 'Escrow',
  Exchange = 'Exchange',
  Governance = 'Governance',
  Reserve = 'Reserve',
}

export interface ContractAddresses {
  [Contracts.Attestations]: string
  [Contracts.Escrow]: string
  [Contracts.Exchange]: string
  [Contracts.Governance]: string
  [Contracts.Reserve]: string
}

let contractAddresses: ContractAddresses

export async function getContractAddresses(): Promise<ContractAddresses> {
  if (contractAddresses) {
    console.info('Already got token addresses')
    return contractAddresses
  }

  try {
    const kit = await getContractKit()
    contractAddresses = {
      Attestations: (await kit.registry.addressFor(CeloContract.Attestations)).toLowerCase(),
      Escrow: (await kit.registry.addressFor(CeloContract.Escrow)).toLowerCase(),
      Exchange: (await kit.registry.addressFor(CeloContract.Exchange)).toLowerCase(),
      Governance: (await kit.registry.addressFor(CeloContract.Governance)).toLowerCase(),
      Reserve: (await kit.registry.addressFor(CeloContract.Reserve)).toLowerCase(),
    }
    console.info('Got token addresses. Attestations: ', contractAddresses)
    return contractAddresses
  } catch (e) {
    console.error('@getContractAddresses() error', e)
    throw new Error('Unable to fetch contract addresses')
  }
}

let contractKit: ContractKit
export async function getContractKit(): Promise<ContractKit> {
  if (contractKit && (await contractKit.connection.isListening())) {
    // Already connected
    return contractKit
  }
  try {
    if (WEB3_PROVIDER_URL) {
      const httpProvider = new Web3.providers.HttpProvider(WEB3_PROVIDER_URL)
      const web3 = new Web3(httpProvider)
      contractKit = newKitFromWeb3(web3)
      return contractKit
    } else {
      throw new Error('Missing web3 provider URL, will not be able to fetch contract addresses.')
    }
  } catch (e) {
    console.error('@getContractKit() error', e)
    throw new Error('Failed to create contractKit instance')
  }
}
