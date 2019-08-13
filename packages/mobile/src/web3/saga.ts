import { deriveCEK } from '@celo/utils/src/commentEncryption'
import { AsyncStorage } from 'react-native'
import { generateMnemonic, mnemonicToSeedHex } from 'react-native-bip39'
import { REHYDRATE } from 'redux-persist/es/constants'
import { call, delay, put, race, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { getPincode } from 'src/account'
import { setAccountCreationTime } from 'src/account/actions'
import { pincodeSelector } from 'src/account/reducer'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { getWordlist } from 'src/backup/utils'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { deleteChainData } from 'src/geth/geth'
import { waitForGethConnectivity } from 'src/geth/saga'
import { redeemComplete } from 'src/invite/actions'
import { navigateToError } from 'src/navigator/NavigationService'
import { waitWeb3LastBlock } from 'src/networkInfo/saga'
import Logger from 'src/utils/Logger'
import {
  Actions,
  getLatestBlock,
  setAccount,
  setLatestBlockNumber,
  setPrivateCommentKey,
  setSyncProgress,
  unlockAccount,
  updateWeb3SyncProgress,
} from 'src/web3/actions'
import { web3 } from 'src/web3/contracts'
import { refreshGasPrice } from 'src/web3/gas'
import { currentAccountSelector } from 'src/web3/selectors'
import { Block } from 'web3/eth/types'

const ETH_PRIVATE_KEY_LENGTH = 64
const MNEMONIC_BIT_LENGTH = (ETH_PRIVATE_KEY_LENGTH * 8) / 2

const TAG = 'web3/saga'
// The timeout for web3 to complete syncing and the latestBlock to be > 0
const CHECK_SYNC_PROGRESS_TIMEOUT = 60000
const BLOCK_CHAIN_CORRUPTION_ERROR = "Error: CONNECTION ERROR: Couldn't connect to node on IPC."

let AssignAccountLock = false

// checks if web3 claims it is currently syncing or not
function* checkWeb3SyncProgressClaim() {
  while (true) {
    try {
      const syncProgress = yield web3.eth.isSyncing() // returns true when it's still syncing and thus not ready
      if (typeof syncProgress === 'boolean' && !syncProgress) {
        Logger.debug(TAG, 'checkWeb3SyncProgressClaim', 'sync complete')

        yield put(setSyncProgress(100))
        return true
      }
      Logger.debug(TAG, 'checkWeb3SyncProgressClaim', 'sync in progress')
      yield put(updateWeb3SyncProgress(syncProgress))
      // not ready yet, keep looping
    } catch (error) {
      if (error.toString().toLowerCase() === BLOCK_CHAIN_CORRUPTION_ERROR.toLowerCase()) {
        CeloAnalytics.track(CustomEventNames.blockChainCorruption, {}, true)
        const deleted = yield call(deleteChainData)
        if (deleted) {
          navigateToError('corruptedChainDeleted')
        }
        throw new Error('Corrupted chain data encountered')
      } else {
        Logger.error(TAG, `checking web3 sync progress: ${error}`)
      }
    }
  }
}

// The worker listening to sync progress requests
export function* checkWeb3Sync() {
  try {
    yield call(waitForGethConnectivity)
    try {
      const { timeout } = yield race({
        checkProgress: call(checkWeb3SyncProgressClaim),
        timeout: delay(CHECK_SYNC_PROGRESS_TIMEOUT),
      })

      if (timeout) {
        Logger.error(TAG, 'Could not complete sync progress check')
        navigateToError('web3FailedToSync')
      }

      const latestBlock: Block = yield call(getLatestBlock)
      if (latestBlock && latestBlock.number > 0) {
        yield put(setLatestBlockNumber(latestBlock.number))
      } else {
        Logger.error(
          TAG,
          `web3 indicated sync complete, yet the latest block is ${JSON.stringify(latestBlock)}`
        )
      }
    } catch (error) {
      Logger.error(TAG, 'checkWeb3Sync', error)
      navigateToError('errorDuringSync')
    }
  } catch (error) {
    Logger.error(TAG, 'checkWeb3Sync saga error', error)
  }
}

export function* createNewAccount() {
  const account = yield select(currentAccountSelector)
  if (account) {
    Logger.debug(
      TAG + '@createNewAccount',
      'Tried to create account twice, returning the existing one'
    )
    return account
  }
  const wordlist = getWordlist(yield select(currentLanguageSelector))
  const mnemonic = String(yield call(generateMnemonic, MNEMONIC_BIT_LENGTH, null, wordlist))
  const privateKey = yield call(mnemonicToSeedHex, mnemonic)
  const accountAddress = yield call(assignAccountFromPrivateKey, privateKey)

  if (accountAddress) {
    try {
      yield call(AsyncStorage.setItem, 'mnemonic', mnemonic)
    } catch (e) {
      Logger.debug(TAG + '@createNewAccount', 'Failed to set mnemonic: ' + e)
      Logger.error(TAG + '@createNewAccount', e)
    }

    return accountAddress
  } else {
    return null
  }
}

export function* assignAccountFromPrivateKey(key: string) {
  const currentAccount = yield select(currentAccountSelector)
  if (AssignAccountLock || currentAccount) {
    Logger.debug(TAG + '@assignAccountFromPrivateKey', 'Account already exists is being created')
    return
  }

  try {
    AssignAccountLock = true

    const pincodeSet = yield select(pincodeSelector)
    if (!pincodeSet) {
      Logger.debug(TAG + '@assignAccountFromPrivateKey', 'PIN does not seem to be set')
      throw Error('Cannot create account without having the pin set')
    }
    const password = yield call(getPincode)
    if (!password) {
      Logger.debug(TAG + '@assignAccountFromPrivateKey', 'Got falsy pin')
      throw Error('Cannot create account without having the pin set')
    }
    // @ts-ignore
    const account = yield call(web3.eth.personal.importRawKey, String(key), password)
    yield call(web3.eth.personal.unlockAccount, account, password, UNLOCK_DURATION)
    Logger.debug(
      TAG + '@assignAccountFromPrivateKey',
      `Created account from mnemonic and added to wallet: ${account}`
    )

    yield put(setAccount(account))
    yield put(redeemComplete(true))
    yield put(setAccountCreationTime())
    yield call(assignDataKeyFromPrivateKey, key)

    web3.eth.defaultAccount = account
    AssignAccountLock = false
    return account
  } catch (e) {
    Logger.error(TAG, `@assignAccountFromPrivateKey: ${e}`)
    yield put(redeemComplete(false))
    return null
  }
}

function* assignDataKeyFromPrivateKey(key: string) {
  const privateCEK = deriveCEK(key).toString('hex')
  yield put(setPrivateCommentKey(privateCEK))
}

// Wait for account to exist and then return it
export function* getAccount() {
  while (true) {
    const account = yield select(currentAccountSelector)
    if (account) {
      return account
    }

    const action = yield take([Actions.SET_ACCOUNT, REHYDRATE])
    if (action.type === REHYDRATE) {
      // Wait for rehydrate and select the state again
      continue
    }
    if (action.address) {
      // account exists
      return action.address
    }
  }
}

// Wait for geth to be connected and account ready
export function* getConnectedAccount() {
  yield call(waitWeb3LastBlock)
  const account: string = yield getAccount()
  return account
}

// Wait for geth to be connected, geth ready, and get unlocked account
export function* getConnectedUnlockedAccount() {
  const account: string = yield call(getConnectedAccount)
  const success: boolean = yield call(unlockAccount, account)
  if (success) {
    return account
  } else {
    throw new Error(ErrorMessages.INCORRECT_PIN)
  }
}

export function* watchRefreshGasPrice() {
  yield takeLatest(Actions.SET_GAS_PRICE, refreshGasPrice)
}

export function* web3Saga() {
  yield spawn(watchRefreshGasPrice)
}

// exported for testing
export const _checkWeb3SyncProgressClaim = checkWeb3SyncProgressClaim
export const _CHECK_SYNC_PROGRESS_TIMEOUT = CHECK_SYNC_PROGRESS_TIMEOUT
