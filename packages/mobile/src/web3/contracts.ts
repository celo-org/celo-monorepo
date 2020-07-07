import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { RpcWallet } from '@celo/contractkit/lib/wallets/rpc-wallet'
import { Platform } from 'react-native'
import * as net from 'react-native-tcp'
import { call, select, take } from 'redux-saga/effects'
import { DEFAULT_FORNO_URL } from 'src/config'
import { IPC_PATH } from 'src/geth/geth'
import { waitForGethConnectivity } from 'src/geth/saga'
import { promisifyGenerator } from 'src/utils/generators'
import Logger from 'src/utils/Logger'
import { Actions } from 'src/web3/actions'
import { contractKitReadySelector, fornoSelector } from 'src/web3/selectors'
import Web3 from 'web3'
import { IpcProvider, provider } from 'web3-core'

const tag = 'web3/contracts'

let ipcProvider: IpcProvider | undefined
let gethWallet: RpcWallet | undefined
let contractKit: ContractKit | undefined

export function openIpcProvider() {
  if (!ipcProvider) {
    Logger.debug(`${tag}@openIpcProvider`, `Initializing IPC connection`)
    ipcProvider = getIpcProvider()
  }
  return ipcProvider
}

export function openWallet() {
  if (!gethWallet) {
    Logger.debug(`${tag}@openWallet`, `Initializing wallet`)
    gethWallet = new RpcWallet(openIpcProvider())
  }
  return gethWallet
}

export function openContractKit(fornoMode: boolean) {
  if (!contractKit) {
    Logger.info(
      `${tag}@openContractKit`,
      `Initializing contractkit, platform: ${Platform.OS}, forno mode: ${fornoMode}`
    )
    const web3 = new Web3(fornoMode ? getHttpProvider(DEFAULT_FORNO_URL) : openIpcProvider())
    const wallet = openWallet()
    contractKit = newKitFromWeb3(web3, wallet)
  }
  return contractKit
}

export function closeContractKit() {
  Logger.debug(`closeContractKit`)
  contractKit = undefined
  gethWallet = undefined
  ipcProvider = undefined
}

export const getConnectedWalletAsync = async () => promisifyGenerator(getConnectedWallet())

export function* getConnectedWallet() {
  yield call(waitForGethConnectivity)
  const wallet = openWallet()
  if (!wallet.isSetupFinished()) {
    yield call([wallet, wallet.init])
    Logger.debug(`getConnectedWallet`, `Initialized wallet with accounts: ${wallet.getAccounts()}`)
  }
  return wallet
}

export const getContractKitAsync = async () => promisifyGenerator(getContractKit())

export function* getContractKit() {
  // No need to waitForRehydrate as contractKitReady set to false for every app reopen
  while (!(yield select(contractKitReadySelector))) {
    // If contractKit locked, wait until unlocked
    yield take(Actions.SET_CONTRACT_KIT_READY)
  }
  const fornoMode = yield select(fornoSelector)
  return openContractKit(fornoMode)
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
