import { deriveCEK } from '@celo/utils/src/commentEncryption'
import { generateMnemonic, mnemonicToSeedHex } from 'react-native-bip39'
import { REHYDRATE } from 'redux-persist/es/constants'
import { call, delay, put, race, select, take } from 'redux-saga/effects'
import { setAccountCreationTime } from 'src/account/actions'
import { getPincode } from 'src/account/saga'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { getWordlist } from 'src/backup/utils'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { deleteChainData } from 'src/geth/geth'
import { navigateToError } from 'src/navigator/NavigationService'
import { waitWeb3LastBlock } from 'src/networkInfo/saga'
import { setKey } from 'src/utils/keyStore'
import Logger from 'src/utils/Logger'
import {
  Actions,
  getLatestBlock,
  setAccount,
  setLatestBlockNumber,
  setPrivateCommentKey,
  updateWeb3SyncProgress,
} from 'src/web3/actions'
import { web3 } from 'src/web3/contracts'
import { currentAccountSelector } from 'src/web3/selectors'
import { Block } from 'web3/eth/types'

const ETH_PRIVATE_KEY_LENGTH = 64
const MNEMONIC_BIT_LENGTH = (ETH_PRIVATE_KEY_LENGTH * 8) / 2

const TAG = 'web3/saga'
// The timeout for web3 to complete syncing and the latestBlock to be > 0
export const SYNC_TIMEOUT = 60000
const BLOCK_CHAIN_CORRUPTION_ERROR = "Error: CONNECTION ERROR: Couldn't connect to node on IPC."

// checks if web3 claims it is currently syncing and attempts to wait for it to complete
export function* checkWeb3SyncProgress() {
  while (true) {
    try {
      Logger.debug(TAG, 'checkWeb3SyncProgress', 'Checking sync progress')

      // isSyncing returns a syncProgress object when it's still syncing, false otherwise
      const syncProgress = yield web3.eth.isSyncing()

      if (typeof syncProgress === 'boolean' && !syncProgress) {
        Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync maybe complete, checking')

        const latestBlock: Block = yield call(getLatestBlock)
        if (latestBlock && latestBlock.number > 0) {
          yield put(setLatestBlockNumber(latestBlock.number))
          Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync is complete')
          return true
        } else {
          Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync not actually complete, still waiting')
        }
      } else {
        yield put(updateWeb3SyncProgress(syncProgress))
      }

      yield delay(100) // wait 100ms while web3 syncs
    } catch (error) {
      if (error.toString().toLowerCase() === BLOCK_CHAIN_CORRUPTION_ERROR.toLowerCase()) {
        CeloAnalytics.track(CustomEventNames.blockChainCorruption, {}, true)
        const deleted = yield call(deleteChainData)
        if (deleted) {
          navigateToError('corruptedChainDeleted')
        }
      } else {
        Logger.error(TAG, 'Unexpected sync error', error)
      }
      return false
    }
  }
}

export function* waitForWeb3Sync() {
  try {
    const { syncComplete, timeout } = yield race({
      syncComplete: call(checkWeb3SyncProgress),
      timeout: delay(SYNC_TIMEOUT),
    })

    if (timeout || !syncComplete) {
      Logger.error(TAG, 'Could not complete sync')
      navigateToError('web3FailedToSync')
      return false
    }

    return true
  } catch (error) {
    Logger.error(TAG, 'checkWeb3Sync', error)
    navigateToError('errorDuringSync')
    return false
  }
}

export function* getOrCreateAccount() {
  const account = yield select(currentAccountSelector)
  if (account) {
    Logger.debug(
      TAG + '@getOrCreateAccount',
      'Tried to create account twice, returning the existing one'
    )
    return account
  }
  Logger.debug(TAG + '@getOrCreateAccount', 'Creating a new account')
  const wordlist = getWordlist(yield select(currentLanguageSelector))
  const mnemonic = String(yield call(generateMnemonic, MNEMONIC_BIT_LENGTH, null, wordlist))
  const privateKey = yield call(mnemonicToSeedHex, mnemonic)
  const accountAddress = yield call(assignAccountFromPrivateKey, privateKey)

  if (accountAddress) {
    try {
      yield call(setKey, 'mnemonic', mnemonic)
    } catch (e) {
      Logger.error(TAG + '@getOrCreateAccount', 'Failed to set mnemonic', e)
    }
    return accountAddress
  } else {
    return null
  }
}

export function* assignAccountFromPrivateKey(key: string) {
  const currentAccount = yield select(currentAccountSelector)

  try {
    const pincode = yield call(getPincode)
    if (!pincode) {
      Logger.error(TAG + '@assignAccountFromPrivateKey', 'Got falsy pin')
      throw Error('Cannot create account without having the pin set')
    }

    let account: string
    try {
      // @ts-ignore
      account = yield call(web3.eth.personal.importRawKey, String(key), pincode)
    } catch (e) {
      if (e.toString().includes('account already exists')) {
        account = currentAccount
        Logger.warn(TAG + '@assignAccountFromPrivateKey', 'Importing same account as current one')
      } else {
        Logger.error(TAG + '@assignAccountFromPrivateKey', 'Error importing raw key')
        throw e
      }
    }

    yield call(web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
    Logger.debug(
      TAG + '@assignAccountFromPrivateKey',
      `Created account from mnemonic and added to wallet: ${account}`
    )

    yield put(setAccount(account))
    yield put(setAccountCreationTime())
    yield call(assignDataKeyFromPrivateKey, key)

    web3.eth.defaultAccount = account
    return account
  } catch (e) {
    Logger.error(
      TAG + '@assignAccountFromPrivateKey',
      'Error assigning account from private key',
      e
    )
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

async function isLocked(address: string) {
  try {
    // Test account to see if it is unlocked
    await web3.eth.sign('', address)
  } catch (e) {
    return true
  }
  return false
}

export function* unlockAccount(account: string) {
  Logger.debug(TAG + '@unlockAccount', `Unlocking account: ${account}`)
  try {
    const isAccountLocked = yield call(isLocked, account)
    if (!isAccountLocked) {
      return true
    }

    const pincode = yield call(getPincode)
    yield call(web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
    Logger.debug(TAG + '@unlockAccount', `Account unlocked: ${account}`)
    return true
  } catch (error) {
    Logger.error(TAG + '@unlockAccount', 'Web3 account unlock failed', error)
    return false
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
