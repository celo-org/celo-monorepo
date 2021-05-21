import { ContractKit, newKit } from '@celo/contractkit'
import config from '../config'

const contractKit = newKit(config.blockchain.provider)

export function getContractKit(): ContractKit {
  return contractKit
}
