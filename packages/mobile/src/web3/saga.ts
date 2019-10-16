import { getAccountAddressFromPrivateKey } from '@celo/walletkit'
import { generateMnemonic, mnemonicToSeedHex } from 'react-native-bip39'
import { REHYDRATE } from 'redux-persist/es/constants'
import { call, delay, put, race, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { setAccountCreationTime } from 'src/account/actions'
import { getPincode } from 'src/account/saga'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { getWordlist } from 'src/backup/utils'
import { DEFAULT_INFURA_URL } from 'src/config'
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
  SetIsZeroSyncAction,
  setLatestBlockNumber,
  setZeroSyncMode,
  updateWeb3SyncProgress,
} from 'src/web3/actions'
import { addLocalAccount, getWebSocketProvider, isZeroSyncMode, web3 } from 'src/web3/contracts'
import { currentAccountSelector } from 'src/web3/selectors'
import {
  assignDataKeyFromPrivateKey,
  ensureAccountInWeb3Keystore,
  ensureAccountSavedLocally,
  readPrivateKeyFromLocalDisk,
  savePrivateKeyToLocalDisk,
} from 'src/web3/zeroSync'
import { Block } from 'web3/eth/types'

const ETH_PRIVATE_KEY_LENGTH = 64
const MNEMONIC_BIT_LENGTH = (ETH_PRIVATE_KEY_LENGTH * 8) / 2

const TAG = 'web3/saga'
// The timeout for web3 to complete syncing and the latestBlock to be > 0
export const SYNC_TIMEOUT = 60000
const BLOCK_CHAIN_CORRUPTION_ERROR = "Error: CONNECTION ERROR: Couldn't connect to node on IPC."

// checks if web3 claims it is currently syncing and attempts to wait for it to complete
export function* checkWeb3SyncProgress() {
  if (isZeroSyncMode()) {
    // In this mode, the check seems to fail with
    // web3/saga/checking web3 sync progress: Error: Invalid JSON RPC response: "":
    return true
  }
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

export function* addAccountToWeb3Keystore(key: string, currentAccount: string, pincode: any) {
  let account: string
  try {
    // @ts-ignore
    account = yield call(web3.eth.personal.importRawKey, String(key), pincode)
    yield put(setAccountInWeb3Keystore(account))
  } catch (e) {
    if (e.toString().includes('account already exists')) {
      account = currentAccount
      Logger.debug(TAG + '@assignAccountFromPrivateKey', 'Importing same account as current one')
    } else {
      Logger.error(TAG + '@assignAccountFromPrivateKey', 'Error importing raw key')
      throw e
    }
  }
  yield call(web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
  web3.eth.defaultAccount = account
  return account
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

    // Save the account to a local file on the disk.
    // This is done for all sync modes, to allow users to switch in to zero sync mode.
    // Note that if geth is running it saves the encrypted key in the web3 keystore.
    account = getAccountAddressFromPrivateKey(key)
    yield savePrivateKeyToLocalDisk(account, key, pincode)

    if (isZeroSyncMode()) {
      // If zero sync mode, add local account
      Logger.debug(TAG + '@assignAccountFromPrivateKey', 'Init web3 with private key')
      addLocalAccount(web3, key)
    } else {
      // Else geth is running, add to web3 accounts
      account = yield call(addAccountToWeb3Keystore, key, currentAccount, pincode)
    }

    Logger.debug(
      TAG + '@assignAccountFromPrivateKey',
      `Created account from mnemonic and added to wallet: ${account}`
    )
    yield put(setAccount(account))
    yield put(setAccountCreationTime())

    yield call(assignDataKeyFromPrivateKey, key)

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

let accountAlreadyAddedInZeroSyncMode = false

export function* unlockAccount(account: string) {
  Logger.debug(TAG + '@unlockAccount', `Unlocking account: ${account}`)
  try {
    const isAccountLocked = yield call(isLocked, account)
    if (!isAccountLocked) {
      return true
    }

    const pincode = yield call(getPincode)
    if (isZeroSyncMode()) {
      if (accountAlreadyAddedInZeroSyncMode) {
        Logger.info(TAG + 'unlockAccount', `Account ${account} already added to web3 for signing`)
      } else {
        Logger.info(TAG + '@unlockAccount', `unlockDuration is ignored in Geth free mode`)
        const privateKey: string = yield readPrivateKeyFromLocalDisk(account, pincode)
        addLocalAccount(web3, privateKey)
        accountAlreadyAddedInZeroSyncMode = true
      }
      return true
    } else {
      yield call(web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
      Logger.debug(TAG + '@unlockAccount', `Account unlocked: ${account}`)
      return true
    }
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

export function* switchToGethFromZeroSync() {
  const account = yield call(ensureAccountInWeb3Keystore)
  setZeroSyncMode(false)
  Logger.debug(
    TAG + '@switchToGethFromZeroSync',
    'Imported account from private key to web3 keystore',
    account
  )
  // TODO(anna) will also need to start geth
  const confirmAccount = yield call(getConnectedAccount)
  Logger.debug(TAG + '@switchToGethFromZeroSync', 'Confirmed account is connected', confirmAccount)
  return true
}

export function* switchToZeroSyncFromGeth() {
  Logger.debug(TAG + 'Switching to zero sync from geth..')
  setZeroSyncMode(true)
  web3.setProvider(getWebSocketProvider(DEFAULT_INFURA_URL))
  const account = yield call(getConnectedAccount)
  yield call(ensureAccountSavedLocally, account)
  Logger.debug(TAG + '@switchToZeroSyncFromGeth', ` zero sync mode is now: ${isZeroSyncMode()}`)
  return true
}

export function* switchZeroSyncMode(action: SetIsZeroSyncAction) {
  Logger.debug(
    TAG + '@switchZeroSyncMode',
    ` zero sync mode will change to: ${action.zeroSyncMode}`
  )
  if (action.zeroSyncMode) {
    yield call(switchToZeroSyncFromGeth)
  } else {
    yield call(switchToGethFromZeroSync)
  }
}

export function* watchZeroSyncMode() {
  yield takeLatest(Actions.SET_IS_ZERO_SYNC, switchZeroSyncMode)
}

export function* web3Saga() {
  yield spawn(watchZeroSyncMode)
}
