import { newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'

export const getContractKit = () => {
  return newKitFromWeb3(new Web3())
}
