import Web3 from 'web3'
import { HttpProviderOptions as Web3HttpProviderOptions } from 'web3-providers-http'
export type HttpProviderOptions = Web3HttpProviderOptions

export const API_KEY_HEADER_KEY = 'apiKey'

/** @internal */
export function setupAPIKey(apiKey: string) {
  const options: HttpProviderOptions = {}
  options.headers = []
  options.headers.push({
    name: API_KEY_HEADER_KEY,
    value: apiKey,
  })
  return options
}
/** @internal */
export function ensureCurrentProvider(web3: Web3) {
  if (!web3.currentProvider) {
    throw new Error('Must have a valid Provider')
  }
}
/** @internal */
export function getWeb3ForKit(url: string, options: Web3HttpProviderOptions | undefined) {
  let web3: Web3
  if (url.endsWith('.ipc')) {
    try {
      const net = require('net')
      web3 = new Web3(new Web3.providers.IpcProvider(url, net))
    } catch (e) {
      console.error('.ipc only works in environments with native net module')
    }
    web3 = new Web3(url)
  } else if (url.toLowerCase().startsWith('http')) {
    web3 = new Web3(new Web3.providers.HttpProvider(url, options))
  } else {
    web3 = new Web3(url)
  }
  return web3
}
