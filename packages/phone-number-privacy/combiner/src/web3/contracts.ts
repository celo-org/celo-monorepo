import { ContractKit, newKit, newKitWithApiKey } from '@celo/contractkit'
import { BlockchainConfig } from '..'

export function getContractKit(config: BlockchainConfig): ContractKit {
  // tslint:disable: no-console
  console.log('Combiner getContractKit')
  console.log(config)
  return config.apiKey ? newKitWithApiKey(config.provider, config.apiKey) : newKit(config.provider)
}
