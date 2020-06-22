import { newKitFromWeb3 } from '@celo/contractkit'
import { RpcWallet } from '@celo/contractkit/lib/wallets/rpc-wallet'
import { Platform } from 'react-native'
import * as net from 'react-native-tcp'
import { call, select, take } from 'redux-saga/effects'
import { DEFAULT_FORNO_URL } from 'src/config'
import { IPC_PATH } from 'src/geth/geth'
import { waitForGethConnectivity } from 'src/geth/saga'
import { store } from 'src/redux/store'
import { promisifyGenerator } from 'src/utils/generators'
import Logger from 'src/utils/Logger'
import { Actions } from 'src/web3/actions'
import { contractKitReadySelector, fornoSelector } from 'src/web3/selectors'
import Web3 from 'web3'
import { provider } from 'web3-core'

const tag = 'web3/contracts'

// TODO(yorke): merge instances of contractkit and refactor retrieval of providers
const ipcProvider = getIpcProvider()
const gethWallet = new RpcWallet(ipcProvider)
const contractKitForno = newKitFromWeb3(getWeb3(true), gethWallet)
const contractKitGeth = newKitFromWeb3(getWeb3(false), gethWallet)
// Web3 for utils does not require a provider, using geth web3 to avoid creating another web3 instance
export const web3ForUtils = contractKitGeth.web3

function getWeb3(fornoMode: boolean): Web3 {
  Logger.info(
    `${tag}@getWeb3`,
    `Initializing web3, platform: ${Platform.OS}, forno mode: ${fornoMode}, provider: ${
      fornoMode ? DEFAULT_FORNO_URL : 'geth'
    }`
  )
  return fornoMode ? new Web3(getHttpProvider(DEFAULT_FORNO_URL)) : new Web3(ipcProvider)
}

export const getConnectedWalletAsync = async () => promisifyGenerator(getConnectedWallet())

export function* getConnectedWallet() {
  yield call(waitForGethConnectivity)
  if (!gethWallet.isSetupFinished()) {
    yield call([gethWallet, gethWallet.init])
    Logger.debug(
      `getConnectedWallet`,
      `Initialized wallet with accounts: ${gethWallet.getAccounts()}`
    )
  }
  return gethWallet
}

// Workaround as contractKit logic is still used outside generators
// Moving towards generators to allow us to block contractKit calls, see https://github.com/celo-org/celo-monorepo/issues/3727
export const getContractKitAsync = async () => promisifyGenerator(getContractKit())

export function* getContractKit() {
  // No need to waitForRehydrate as contractKitReady set to false for every app reopen
  while (!(yield select(contractKitReadySelector))) {
    // If contractKit locked, wait until unlocked
    yield take(Actions.SET_CONTRACT_KIT_READY)
  }
  const forno = fornoSelector(store.getState())
  return forno ? contractKitForno : contractKitGeth
}

export function getIpcProvider() {
  Logger.debug(tag, 'creating IPCProvider...')

  const _ipcProvider = new Web3.providers.IpcProvider(IPC_PATH, net)
  Logger.debug(tag, 'created IPCProvider')

  // More details on the IPC objects can be seen via this
  // console.debug("Ipc connection object is " + Object.keys(ipcProvider.connection));
  // console.debug("Ipc data handle is " + ipcProvider.connection._events['data']);
  // @ts-ignore
  const ipcProviderConnection: any = _ipcProvider.connection
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
  return _ipcProvider
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
