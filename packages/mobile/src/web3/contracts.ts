/**
 * This file is called 'contracts' but it's responsibilies have changed over time.
 * It now manages contractKit and gethWallet initialization.
 * Leaving the name for recognizability to current devs
 */
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { RpcWallet } from '@celo/contractkit/lib/wallets/rpc-wallet'
import { sleep } from '@celo/utils/src/async'
import { call, select } from 'redux-saga/effects'
import { DEFAULT_FORNO_URL } from 'src/config'
import { waitForGethConnectivity, waitForGethInitialized } from 'src/geth/saga'
import Logger from 'src/utils/Logger'
import { getHttpProvider, getIpcProvider } from 'src/web3/providers'
import { fornoSelector } from 'src/web3/selectors'
import Web3 from 'web3'
import { IpcProvider } from 'web3-core'

const TAG = 'web3/contracts'

let ipcProvider: IpcProvider | undefined
let gethWallet: RpcWallet | undefined
let contractKit: ContractKit | undefined

export function* initContractKit() {
  // The kit must wait for Geth to be initialized because
  // Geth is required for the RpcWallet
  yield call(waitForGethInitialized)

  if (contractKit || ipcProvider || gethWallet) {
    throw new Error('Kit not properly destroyed')
  }

  const fornoMode = yield select(fornoSelector)
  Logger.info(`${TAG}@initContractKit`, `Initializing contractkit, forno mode: ${fornoMode}`)

  ipcProvider = getIpcProvider()
  const web3 = new Web3(fornoMode ? getHttpProvider(DEFAULT_FORNO_URL) : ipcProvider)

  Logger.debug(`${TAG}@initContractKit`, `Initializing wallet`)
  gethWallet = new RpcWallet(ipcProvider)
  yield call([gethWallet, gethWallet.init])
  Logger.debug(
    `${TAG}@initContractKit`,
    `Initialized wallet with accounts: ${gethWallet.getAccounts()}`
  )
  contractKit = newKitFromWeb3(web3, gethWallet)
}

export function destroyContractKit() {
  Logger.debug(`${TAG}@closeContractKit`)
  contractKit = undefined
  gethWallet = undefined
  ipcProvider = undefined
}

export function* getContractKit() {
  if (!contractKit) {
    yield call(initContractKit)
  }
  return contractKit
}

export function* getConnectedContractKit() {
  const kit = yield call(getContractKit)
  yield call(waitForGethConnectivity)
  return kit
}

// Used for cases where CK must be access outside of a saga
export async function getContractKitAsync() {
  let retries = 10
  while (!contractKit) {
    Logger.warn(`${TAG}@getContractKitAsync`, 'Contract Kit not yet initalized')
    if (retries > 0) {
      Logger.warn(`${TAG}@getContractKitAsync`, 'Sleeping then retrying')
      retries -= 1
      await sleep(1000)
    } else {
      throw new Error('Contract kit intialization timeout')
    }
  }

  return contractKit
}

export function* getWallet() {
  if (!gethWallet) {
    yield call(initContractKit)
  }
  return gethWallet
}

// Used for cases where the wallet must be access outside of a saga
export async function getWalletAsync() {
  if (!gethWallet) {
    await getContractKitAsync()
  }

  if (!gethWallet) {
    throw new Error(
      'Geth wallet still undefined even after contract kit init. Should never happen.'
    )
  }

  return gethWallet
}

// Convinience util for getting the kit's web3 instance
export function* getWeb3() {
  const kit: ContractKit = yield call(getContractKit)
  return kit.web3
}

// Used for cases where the kit's web3 must be accessed outside a saga
export async function getWeb3Async() {
  const kit = await getContractKitAsync()
  return kit.web3
}
