import { Platform } from 'react-native'
import { DocumentDirectoryPath } from 'react-native-fs'
import * as net from 'react-native-tcp'
import Logger from 'src/utils/Logger'
import { DEFAULT_TESTNET, Testnets } from 'src/web3/testnets'
import Web3 from 'web3'

// Logging tag
const tag = 'web3/contracts'

const getWeb3IpcProvider = (testnet: Testnets) => {
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

const getWeb3HttpProvider = (testnet: Testnets) => {
  Logger.debug(tag, 'creating HttpProvider...')

  const httpProvider = new Web3.providers.HttpProvider('http://localhost:8545')
  Logger.debug(tag, 'created HttpProvider')

  return httpProvider
}

// Use Http provider on iOS until we add support for local socket on iOS in react-native-tcp
export const getWeb3Provider = Platform.OS === 'ios' ? getWeb3HttpProvider : getWeb3IpcProvider

export const setWeb3Provider = (testnet: Testnets) => {
  web3.setProvider(getWeb3Provider(testnet))
}

export let web3 = new Web3(getWeb3Provider(DEFAULT_TESTNET))
