import { ContractKit, newKit, newKitWithApiKey } from '@celo/contractkit'

export interface BlockchainConfig {
  provider: string
  apiKey?: string
}

export function getContractKit(config: BlockchainConfig): ContractKit {
  return config.apiKey ? newKitWithApiKey(config.provider, config.apiKey) : newKit(config.provider)
}
