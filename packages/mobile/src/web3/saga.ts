import { generateKeys, generateMnemonic, MnemonicStrength } from '@celo/utils/src/account'
import { privateKeyToAddress } from '@celo/utils/src/address'
import { deriveCEK } from '@celo/utils/src/commentEncryption'
import * as Sentry from '@sentry/react-native'
import * as bip39 from 'react-native-bip39'
import { REHYDRATE } from 'redux-persist/es/constants'
import { call, delay, put, race, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { setAccountCreationTime, setPromptForno } from 'src/account/actions'
import { getPincode } from 'src/account/saga'
import { promptFornoIfNeededSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { getWordlist } from 'src/backup/utils'
import { features } from 'src/flags'
import { cancelGethSaga } from 'src/geth/actions'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { deleteChainData, stopGethIfInitialized } from 'src/geth/geth'
import { gethSaga, waitForGethConnectivity } from 'src/geth/saga'
import { gethStartedThisSessionSelector } from 'src/geth/selectors'
import { navigate, navigateToError } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { setCachedPincode } from 'src/pincode/PincodeCache'
import { restartApp } from 'src/utils/AppRestart'
import { setKey } from 'src/utils/keyStore'
import Logger from 'src/utils/Logger'
import {
  Actions,
  completeWeb3Sync,
  setAccount,
  setAccountInWeb3Keystore,
  setContractKitReady,
  setFornoMode,
  SetIsFornoAction,
  setPrivateCommentKey,
  updateWeb3SyncProgress,
  Web3SyncProgress,
} from 'src/web3/actions'
import { addLocalAccount, getContractKit } from 'src/web3/contracts'
import { readPrivateKeyFromLocalDisk, savePrivateKeyToLocalDisk } from 'src/web3/privateKey'
import {
  currentAccountInWeb3KeystoreSelector,
  currentAccountSelector,
  fornoSelector,
} from 'src/web3/selectors'
import { getLatestBlock, isAccountLocked } from 'src/web3/utils'
import { Block } from 'web3-eth'

const TAG = 'web3/saga'

const MNEMONIC_BIT_LENGTH = MnemonicStrength.s256_24words
// The timeout for web3 to complete syncing and the latestBlock to be > 0
export const SYNC_TIMEOUT = 2 * 60 * 1000 // 2 minutes
const BLOCK_CHAIN_CORRUPTION_ERROR = "Error: CONNECTION ERROR: Couldn't connect to node on IPC."
const SWITCH_TO_FORNO_TIMEOUT = 15000 // if syncing takes >15 secs, suggest switch to forno
const WEB3_MONITOR_DELAY = 100

// checks if web3 claims it is currently syncing and attempts to wait for it to complete
export function* checkWeb3SyncProgress() {
  Logger.debug(TAG, 'checkWeb3SyncProgress', 'Checking sync progress')

  let syncLoops = 0
  while (true) {
    try {
      let syncProgress: boolean | Web3SyncProgress

      // isSyncing returns a syncProgress object when it's still syncing, false otherwise
      const contractKit = yield call(getContractKit)
      syncProgress = yield call(contractKit.web3.eth.isSyncing)

      if (typeof syncProgress === 'boolean' && !syncProgress) {
        Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync maybe complete, checking')

        const latestBlock: Block = yield call(getLatestBlock)
        if (latestBlock && latestBlock.number > 0) {
          yield put(completeWeb3Sync(latestBlock.number))
          Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync is complete')
          return true
        } else {
          Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync not actually complete, still waiting')
        }
      } else if (typeof syncProgress === 'object') {
        yield put(updateWeb3SyncProgress(syncProgress))
      } else {
        throw new Error('Invalid syncProgress type')
      }
      yield delay(WEB3_MONITOR_DELAY) // wait 100ms while web3 syncs then check again
      syncLoops += 1
      if (syncLoops * WEB3_MONITOR_DELAY > SWITCH_TO_FORNO_TIMEOUT) {
        if (yield select(promptFornoIfNeededSelector) && features.DATA_SAVER) {
          yield put(setPromptForno(false))
          navigate(Screens.DataSaver, { promptModalVisible: true })
          return true
        }
      }
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
    const { syncComplete, timeout, fornoSwitch } = yield race({
      syncComplete: call(checkWeb3SyncProgress),
      timeout: delay(SYNC_TIMEOUT),
      fornoSwitch: take(Actions.TOGGLE_IS_FORNO),
    })
    if (fornoSwitch) {
      Logger.debug(
        `${TAG}@waitForWeb3Sync`,
        'Switching providers, expected web3 sync failure occured'
      )
      return true
    }
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

export function* waitWeb3LastBlock() {
  if (!(yield select(fornoSelector))) {
    yield call(waitForGethConnectivity)
    yield call(waitForWeb3Sync)
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

  try {
    Logger.debug(TAG + '@getOrCreateAccount', 'Creating a new account')

    const wordlist = getWordlist(yield select(currentLanguageSelector))
    let mnemonic: string = yield call(generateMnemonic, MNEMONIC_BIT_LENGTH, wordlist, bip39)

    // Ensure no duplicates in mnemonic
    const checkDuplicate = (someString: string) => {
      return new Set(someString.split(' ')).size !== someString.split(' ').length
    }
    let duplicateInMnemonic = checkDuplicate(mnemonic)
    while (duplicateInMnemonic) {
      Logger.debug(TAG + '@getOrCreateAccount', 'Regenerating mnemonic to avoid duplicates')
      mnemonic = yield call(generateMnemonic, MNEMONIC_BIT_LENGTH, wordlist, bip39)
      duplicateInMnemonic = checkDuplicate(mnemonic)
    }

    if (!mnemonic) {
      throw new Error('Failed to generate mnemonic')
    }

    const keys = yield call(generateKeys, mnemonic, undefined, undefined, bip39)
    const privateKey = keys.privateKey
    if (!privateKey) {
      throw new Error('Failed to convert mnemonic to hex')
    }

    const accountAddress = yield call(assignAccountFromPrivateKey, privateKey)
    if (!accountAddress) {
      throw new Error('Failed to assign account from private key')
    }

    yield call(setKey, 'mnemonic', mnemonic)

    return accountAddress
  } catch (error) {
    // Capturing error in sentry for now as we debug backup key issue
    Sentry.captureException(error)
    Logger.error(TAG + '@getOrCreateAccount', 'Error creating account', error)
    throw new Error(ErrorMessages.ACCOUNT_SETUP_FAILED)
  }
}

export function* assignAccountFromPrivateKey(privateKey: string) {
  try {
    const pincode = yield call(getPincode, false)
    if (!pincode) {
      Logger.error(TAG + '@assignAccountFromPrivateKey', 'Got falsy pin')
      throw Error('Cannot create account without having the pin set')
    }

    // Save the account to a local file on the disk.
    // This is done for all sync modes, to allow users to switch into forno mode.
    // Note that if geth is running it saves the key using web3.personal.
    const account = privateKeyToAddress(privateKey)
    yield call(savePrivateKeyToLocalDisk, account, privateKey, pincode)

    const fornoMode = yield select(fornoSelector)
    const contractKit = yield call(getContractKit)
    if (fornoMode) {
      Logger.debug(TAG + '@assignAccountFromPrivateKey', 'Init web3 with private key')
      addLocalAccount(privateKey, true)
    } else {
      try {
        yield call(contractKit.web3.eth.personal.importRawKey, privateKey, pincode)
      } catch (e) {
        if (e.toString().includes('account already exists')) {
          Logger.warn(TAG + '@assignAccountFromPrivateKey', 'Attempted to import same account')
        } else {
          Logger.error(TAG + '@assignAccountFromPrivateKey', 'Error importing raw key')
          throw e
        }
      }
      yield call(contractKit.web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
      contractKit.web3.eth.defaultAccount = account
    }

    Logger.debug(TAG + '@assignAccountFromPrivateKey', `Added to wallet: ${account}`)
    yield put(setAccount(account))
    yield put(setAccountCreationTime())
    yield call(assignDataKeyFromPrivateKey, privateKey)
    return account
  } catch (e) {
    Logger.error(TAG + '@assignAccountFromPrivateKey', 'Error assigning account', e)
    throw e
  }
}

function* assignDataKeyFromPrivateKey(privateKey: string) {
  const privateCEK = deriveCEK(privateKey).toString('hex')
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

let accountAlreadyAddedInFornoMode = false

export function* unlockAccount(account: string) {
  Logger.debug(TAG + '@unlockAccount', `Unlocking account: ${account}`)
  try {
    const isLocked = yield call(isAccountLocked, account)
    if (!isLocked) {
      return true
    }

    const pincode = yield call(getPincode, true)
    const fornoMode = yield select(fornoSelector)
    if (fornoMode) {
      if (accountAlreadyAddedInFornoMode) {
        Logger.info(TAG + 'unlockAccount', `Account ${account} already added to web3 for signing`)
      } else {
        Logger.info(TAG + '@unlockAccount', `unlockDuration is ignored in forno mode`)
        const privateKey: string = yield call(readPrivateKeyFromLocalDisk, account, pincode)
        addLocalAccount(privateKey, true)
        accountAlreadyAddedInFornoMode = true
      }
      return true
    } else {
      const contractKit = yield call(getContractKit)
      yield call(contractKit.web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
      Logger.debug(TAG + '@unlockAccount', `Account unlocked: ${account}`)
      return true
    }
  } catch (error) {
    setCachedPincode(null)
    Logger.error(TAG + '@unlockAccount', 'Web3 account unlock failed', error)
    return false
  }
}

// Wait for geth to be connected and account ready
export function* getConnectedAccount() {
  yield call(waitWeb3LastBlock)
  const account: string = yield call(getAccount)
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

// Stores account and private key in web3 keystore using web3.eth.personal
export function* addAccountToWeb3Keystore(key: string, currentAccount: string, pincode: string) {
  let account: string
  Logger.debug(TAG + '@addAccountToWeb3Keystore', `using key ${key} for account ${currentAccount}`)
  const fornoMode = yield select(fornoSelector)
  const contractKit = yield call(getContractKit)
  if (fornoMode) {
    // web3.eth.personal is not accessible in forno mode
    throw new Error('Cannot add account to Web3 keystore while in forno mode')
  }
  try {
    account = yield call(contractKit.web3.eth.personal.importRawKey, key, pincode)
    Logger.debug(
      TAG + '@addAccountToWeb3Keystore',
      `Successfully imported raw key for account ${account}`
    )
    yield put(setAccountInWeb3Keystore(account))
  } catch (e) {
    Logger.error(TAG + '@addAccountToWeb3Keystore', 'Failed to import raw key', e)
    if (e.toString().includes('account already exists')) {
      account = currentAccount
      Logger.debug(TAG + '@addAccountToWeb3Keystore', 'Importing same account as current one')
    } else {
      Logger.error(TAG + '@addAccountToWeb3Keystore', 'Error importing raw key')
      throw e
    }
  }
  yield call(contractKit.web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
  contractKit.web3.eth.defaultAccount = account
  return account
}

export function* ensureAccountInWeb3Keystore() {
  const currentAccount: string = yield select(currentAccountSelector)
  if (currentAccount) {
    const accountInWeb3Keystore: string = yield select(currentAccountInWeb3KeystoreSelector)
    if (!accountInWeb3Keystore) {
      Logger.debug(
        TAG + '@ensureAccountInWeb3Keystore',
        'Importing account from private key to web3 keystore'
      )
      const pincode = yield call(getPincode, true)
      const privateKey: string = yield call(readPrivateKeyFromLocalDisk, currentAccount, pincode)
      const account: string = yield call(
        addAccountToWeb3Keystore,
        privateKey,
        currentAccount,
        pincode
      )
      return account
    } else if (accountInWeb3Keystore.toLowerCase() === currentAccount.toLowerCase()) {
      return accountInWeb3Keystore
    } else {
      throw new Error(
        `Account in web3 keystore (${accountInWeb3Keystore}) does not match current account (${currentAccount})`
      )
    }
  } else {
    throw new Error('Account not yet initialized')
  }
}

export function* switchToGethFromForno() {
  Logger.debug(TAG, 'Switching to geth from forno..')
  const gethAlreadyStartedThisSession = yield select(gethStartedThisSessionSelector)
  if (gethAlreadyStartedThisSession) {
    // Restart app to allow users to start geth a second time
    // TODO remove when https://github.com/celo-org/celo-monorepo/issues/2101 fixed
    Logger.debug(TAG + '@switchToGethFromForno', 'Restarting...')
    restartApp()
    return
  }
  try {
    yield put(setContractKitReady(false)) // Lock contractKit during provider switch
    yield put(setFornoMode(false))
    yield spawn(gethSaga)
    yield call(waitForGethConnectivity)
    yield put(setContractKitReady(true))
    // After switching off forno mode, ensure key is stored in web3.personal
    // Note that this must happen after contractKit unlocked
    yield call(ensureAccountInWeb3Keystore)
    Logger.debug(TAG + '@switchToGethFromForno', 'Ensured in keystore')
  } catch (e) {
    Logger.error(TAG + '@switchToGethFromForno', 'Error switching to geth from forno')
    yield put(showError(ErrorMessages.FAILED_TO_SWITCH_SYNC_MODES))
    yield put(setContractKitReady(true))
  }
}

export function* switchToFornoFromGeth() {
  Logger.debug(TAG, 'Switching to forno from geth..')
  try {
    yield put(setContractKitReady(false)) // Lock contractKit during provider switch
    yield put(setFornoMode(true))
    yield put(cancelGethSaga())
    yield call(stopGethIfInitialized)
    yield put(setContractKitReady(true))
  } catch (e) {
    Logger.error(TAG + '@switchToFornoFromGeth', 'Error switching to forno from geth')
    yield put(showError(ErrorMessages.FAILED_TO_SWITCH_SYNC_MODES))
    yield put(setContractKitReady(true))
  }
}

export function* toggleFornoMode(action: SetIsFornoAction) {
  if ((yield select(fornoSelector)) !== action.fornoMode) {
    Logger.debug(TAG + '@toggleFornoMode', ` to: ${action.fornoMode}`)
    if (action.fornoMode) {
      yield call(switchToFornoFromGeth)
    } else {
      yield call(switchToGethFromForno)
    }
    // Unlock account to ensure private keys are accessible in new mode
    try {
      const account = yield call(getConnectedUnlockedAccount)
      Logger.debug(
        TAG + '@toggleFornoMode',
        `Switched to ${action.fornoMode} and able to unlock account ${account}`
      )
    } catch (e) {
      // Rollback if private keys aren't accessible in new mode
      if (action.fornoMode) {
        yield call(switchToGethFromForno)
      } else {
        yield call(switchToFornoFromGeth)
      }
    }
  } else {
    Logger.debug(TAG + '@toggleFornoMode', ` already in desired state: ${action.fornoMode}`)
  }
}

export function* watchFornoMode() {
  yield takeLatest(Actions.TOGGLE_IS_FORNO, toggleFornoMode)
}

export function* web3Saga() {
  yield spawn(watchFornoMode)
  yield spawn(waitWeb3LastBlock)
}
