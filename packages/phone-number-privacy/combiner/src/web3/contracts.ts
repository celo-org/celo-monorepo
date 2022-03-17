import { ContractKit, newKit, newKitWithApiKey } from '@celo/contractkit'
import config from '../config'

const contractKit = config.blockchain.apiKey
  ? newKitWithApiKey(config.blockchain.provider, config.blockchain.apiKey)
  : newKit(config.blockchain.provider)

export function getContractKit(): ContractKit {
  return contractKit
}
