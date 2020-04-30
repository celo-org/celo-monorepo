import { newKitFromWeb3 } from '@celo/contractkit'
import { privateKeyToAddress } from '@celo/utils/src/address'
import { Platform } from 'react-native'
import * as net from 'react-native-tcp'
import { select, take } from 'redux-saga/effects'
import sleep from 'sleep-promise'
import { DEFAULT_FORNO_URL } from 'src/config'
import { IPC_PATH } from 'src/geth/geth'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'
import { Actions } from 'src/web3/actions'
import { contractKitReadySelector, fornoSelector } from 'src/web3/selectors'
import Web3 from 'web3'
import { provider } from 'web3-core'

const tag = 'web3/contracts'

export const web3ForUtils: Web3 = new Web3() // Web3 with no provider
const contractKitForno = newKitFromWeb3(getWeb3(true))
const contractKitGeth = newKitFromWeb3(getWeb3(false))

function getWeb3(fornoMode: boolean): Web3 {
  Logger.info(
    `${tag}@getWeb3`,
    `Initializing web3, platform: ${Platform.OS}, forno mode: ${fornoMode}, provider: ${
      fornoMode ? DEFAULT_FORNO_URL : 'geth'
    }`
  )
  return fornoMode ? new Web3(getHttpProvider(DEFAULT_FORNO_URL)) : new Web3(getIpcProvider())
}

export async function getContractKitOutsideGenerator() {
  // Poll store until rehydrated
  while (!store) {
    Logger.debug(`getContractKitOutsideGenerator`, `Still waiting for store...`)
    await sleep(250) // Every 0.25 seconds
  }
  // Once have store, make sure contractKit is ready
  /*
  while (contractKitReadySelector(store.getState())) {
    // Must wait for contractKit to be Ready
  }
  */
  Logger.debug(`${tag}@getContractKitOutsideGenerator`, 'Store rehydrated, returning kit')
  return getContractKitBasedOnFornoInStore()
}

export function* getContractKit() {
  Logger.debug(
    `${tag}@getContractKit`,
    `contractKitReady1: ${yield select(contractKitReadySelector)}`
  )
  // No need to waitForRehydrate as contractKitReady set to false for every app reopen
  while (!(yield select(contractKitReadySelector))) {
    // If contractKit locked, wait until unlocked
    // TODO(anna) see if this is necessary or if we can just wait for rehydrate
    yield take(Actions.SET_CONTRACT_KIT_READY)
    Logger.debug(
      `${tag}@getContractKit`,
      `got new action, contractKitReadyn: ${yield select(contractKitReadySelector)}`
    )
  }
  Logger.debug(
    `${tag}@getContractKit`,
    `should be ready. Ready in store: ${yield select(contractKitReadySelector)}`
  )
  return getContractKitBasedOnFornoInStore()
}

export function getContractKitBasedOnFornoInStore() {
  // Make sure contractKitReady
  const forno = fornoSelector(store.getState())
  Logger.debug(
    `getContractKitBasedOnFornoInStore`,
    `Returning kit for ${forno ? 'forno' : 'geth'} mode`
  )
  return forno ? contractKitForno : contractKitGeth
}

function getIpcProvider() {
  Logger.debug(tag, 'creating IPCProvider...')

  const ipcProvider = new Web3.providers.IpcProvider(IPC_PATH, net)
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

function getHttpProvider(url: string): provider {
  Logger.debug(tag, 'creating HttpProvider...')
  const httpProvider = new Web3.providers.HttpProvider(url)
  Logger.debug(tag, 'created HttpProvider')
  // In the future, we might decide to over-ride the error handler via the following code.
  // provider.on('error', () => {
  //   Logger.showError('Error occurred')
  // })
  return httpProvider
}

export function addLocalAccount(privateKey: string, isDefault: boolean = false) {
  if (!privateKey) {
    throw new Error(`privateKey is ${privateKey}`)
  }
  contractKitForno.addAccount(privateKey)
  if (isDefault) {
    contractKitForno.defaultAccount = privateKeyToAddress(privateKey)
  }
}
