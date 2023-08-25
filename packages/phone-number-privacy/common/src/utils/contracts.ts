import { ContractKit, HttpProviderOptions, newKit, newKitWithApiKey } from '@celo/contractkit'
import http from 'http'
import https from 'https'

export interface BlockchainConfig {
  provider: string
  apiKey?: string
}

export function getContractKit(config: BlockchainConfig): ContractKit {
  return config.apiKey ? newKitWithApiKey(config.provider, config.apiKey) : newKit(config.provider)
}

export function getContractKitWithAgent(config: BlockchainConfig): ContractKit {
  const options: HttpProviderOptions = {}
  options.agent = {
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true }),
  }
  options.keepAlive = true
  if (config.apiKey) {
    options.headers = []
    options.headers.push({
      name: 'apiKey',
      value: config.apiKey,
    })
  }
  return newKit(config.provider, undefined, options)
}
