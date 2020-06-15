import { newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'

export function* getContractKit() {
  return newKitFromWeb3(new Web3())
}

export async function getContractKitOutsideGenerator() {
  return newKitFromWeb3(new Web3())
}

export const web3ForUtils = new Web3()
