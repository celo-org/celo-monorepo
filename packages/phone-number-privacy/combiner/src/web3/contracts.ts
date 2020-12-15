import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'
import config from '../config'

const contractKit = newKitFromWeb3(new Web3(config.blockchain.provider))

export function getContractKit(): ContractKit {
  return contractKit
}
