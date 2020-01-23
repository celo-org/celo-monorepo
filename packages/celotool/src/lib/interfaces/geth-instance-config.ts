import { GethRunConfig } from './geth-run-config'

export interface GethInstanceConfig {
  gethRunConfig: GethRunConfig
  name: string
  validating?: boolean
  validatingGasPrice?: number
  syncmode: string
  port: number
  proxyport?: number
  rpcport?: number
  wsport?: number
  lightserv?: boolean
  privateKey?: string
  etherbase?: string
  peers?: string[]
  proxies?: Array<string[2]>
  pid?: number
  isProxied?: boolean
  isProxy?: boolean
  bootnodeEnode?: string
  proxy?: string
  proxiedValidatorAddress?: string
  ethstats?: string
}
