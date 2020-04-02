import { newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'
import config from '../config'

const web3: Web3 = new Web3(new Web3.providers.HttpProvider(config.blockchain.provider))
const contractKit = newKitFromWeb3(web3)

export function getContractKit() {
  return contractKit
}
