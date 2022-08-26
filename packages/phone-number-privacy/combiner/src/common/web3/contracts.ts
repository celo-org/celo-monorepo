import { ContractKit, newKit, newKitWithApiKey } from '@celo/contractkit'
import { BlockchainConfig } from '../..'

export function getContractKit(config: BlockchainConfig): ContractKit {
  return config.apiKey ? newKitWithApiKey(config.provider, config.apiKey) : newKit(config.provider)
}
