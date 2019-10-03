import { addLocalAccount as web3utilsAddLocalAccount } from '@celo/walletkit'
import { Platform } from 'react-native'
import { DocumentDirectoryPath } from 'react-native-fs'
import * as net from 'react-native-tcp'
import { DEFAULT_INFURA_URL } from 'src/config'
import { GethSyncMode } from 'src/geth/consts'
import config from 'src/geth/network-config'
import Logger from 'src/utils/Logger'
import { DEFAULT_TESTNET, Testnets } from 'src/web3/testnets'
import Web3 from 'web3'
import { Provider } from 'web3/providers'

// Logging tag
const tag = 'web3/contracts'

export const web3: Web3 = getWeb3()

export function isZeroSyncMode(): boolean {
  return config[DEFAULT_TESTNET].syncMode === GethSyncMode.ZeroSync
}

function getIpcProvider(testnet: Testnets) {
  Logger.debug(tag, 'creating IPCProvider...')

  const ipcProvider = new Web3.providers.IpcProvider(
    `${DocumentDirectoryPath}/.${testnet}/geth.ipc`,
    net
  )
  Logger.debug(tag, 'created IPCProvider')

  // More details on the IPC objects can be seen via this
  // console.debug("Ipc connection object is " + Object.keys(ipcProvider.connection));
  // console.debug("Ipc data handle is " + ipcProvider.connection._events['data']);
  // @ts-ignore
  const ipcProviderConnection: any = ipcProvider.connection
  const dataResponseHandlerKey: string = 'data'
  const oldDataHandler = ipcProviderConnection._events[dataResponseHandlerKey]
  // Since we are modifying internal properties of IpcProvider, it is best to add this check to ensure that
  // any future changes to IpcProvider internals will cause an error instead of a silent failure.
  if (oldDataHandler === 'undefined') {
    throw new Error('Data handler is not defined')
  }
  ipcProviderConnection._events[dataResponseHandlerKey] = (data: any) => {
    if (data.toString().indexOf('"message":"no suitable peers available"') !== -1) {
      // This is Crude check which can be improved. What we are trying to match is
      // {"jsonrpc":"2.0","id":2,"error":{"code":-32000,"message":"no suitable peers available"}}
      Logger.debug(tag, `Error suppressed: ${data}`)
      return true
    } else {
      // Logger.debug(tag, `Received data over IPC: ${data}`)
      oldDataHandler(data)
    }
  }

  // In the future, we might decide to over-ride the error handler via the following code.
  // ipcProvider.on("error", () => {
  //   Logger.showError("Error occurred");
  // })
  return ipcProvider
}

// Use Http provider on iOS until we add support for local socket on iOS in react-native-tcp
function getWeb3HttpProviderForIos(): Provider {
  Logger.debug(tag, 'creating HttpProvider for iOS...')

  const httpProvider = new Web3.providers.HttpProvider('http://localhost:8545')
  Logger.debug(tag, 'created HttpProvider for iOS')

  return httpProvider
}

function getWebSocketProvider(url: string): Provider {
  Logger.debug(tag, 'creating HttpProvider...')
  const provider = new Web3.providers.HttpProvider(url)
  Logger.debug(tag, 'created HttpProvider')
  // In the future, we might decide to over-ride the error handler via the following code.
  // provider.on('error', () => {
  //   Logger.showError('Error occurred')
  // })
  return provider
}

function getWeb3(): Web3 {
  Logger.info(`Initializing web3, platform: ${Platform.OS}, geth free mode: ${isZeroSyncMode()}`)

  if (isZeroSyncMode() && Platform.OS === 'ios') {
    throw new Error('Zero sync mode is currently not supported on iOS')
  } else if (isZeroSyncMode()) {
    // Geth free mode
    const url = DEFAULT_INFURA_URL
    Logger.debug('contracts@getWeb3', `Connecting to url ${url}`)
    return new Web3(getWebSocketProvider(url))
  } else if (Platform.OS === 'ios') {
    // iOS + local geth
    return new Web3(getWeb3HttpProviderForIos())
  } else {
    return new Web3(getIpcProvider(DEFAULT_TESTNET))
  }
}

export function addLocalAccount(web3Instance: Web3, privateKey: string) {
  if (!isZeroSyncMode()) {
    throw new Error('addLocalAccount can only be called in Zero sync mode')
  }
  if (!web3Instance) {
    throw new Error(`web3 instance is ${web3Instance}`)
  }
  if (!privateKey) {
    throw new Error(`privateKey is ${privateKey}`)
  }
  web3utilsAddLocalAccount(web3Instance, privateKey)
}
