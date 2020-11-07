import BigNumber from 'bignumber.js'

export interface GethInstanceConfig {
  name: string
  validating?: boolean
  replica?: boolean
  validatingGasPrice?: number
  syncmode: string
  port: number
  proxyport?: number
  rpcport?: number
  wsport?: number
  lightserv?: boolean
  privateKey?: string
  etherbase?: string
  proxies?: Array<string[2]>
  pid?: number
  isProxied?: boolean
  isProxy?: boolean
  bootnodeEnode?: string
  proxy?: string
  proxiedValidatorAddress?: string
  proxyAllowPrivateIp?: boolean
  ethstats?: string
  gatewayFee?: BigNumber
}
