import { RpcWallet, RpcWalletErrors } from '@celo/contractkit/lib/wallets/rpc-wallet'
import { generateKeys, generateMnemonic, MnemonicStrength } from '@celo/utils/src/account'
import { privateKeyToAddress } from '@celo/utils/src/address'
import { deriveCEK } from '@celo/utils/src/commentEncryption'
import * as bip39 from 'react-native-bip39'
import { REHYDRATE } from 'redux-persist/es/constants'
import { call, delay, put, race, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { setAccountCreationTime, setPromptForno } from 'src/account/actions'
import { promptFornoIfNeededSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { getWordlist, storeMnemonic } from 'src/backup/utils'
import { features } from 'src/flags'
import { cancelGethSaga } from 'src/geth/actions'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { deleteChainData, stopGethIfInitialized } from 'src/geth/geth'
import { gethSaga, waitForGethConnectivity } from 'src/geth/saga'
import { navigate, navigateToError } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getPasswordSaga } from 'src/pincode/authentication'
import { clearPasswordCaches } from 'src/pincode/PasswordCache'
import Logger from 'src/utils/Logger'
import {
  Actions,
  completeWeb3Sync,
  setAccount,
  setContractKitReady,
  setFornoMode,
  SetIsFornoAction,
  setPrivateCommentKey,
  updateWeb3SyncProgress,
  Web3SyncProgress,
} from 'src/web3/actions'
import { getConnectedWallet, getContractKit } from 'src/web3/contracts'
import { currentAccountSelector, fornoSelector } from 'src/web3/selectors'
import { getLatestBlock } from 'src/web3/utils'
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
          navigate(Screens.Settings, { promptFornoModal: true })
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
  const account: string = yield select(currentAccountSelector)
  if (account) {
    Logger.debug(
      TAG + '@getOrCreateAccount',
      'Tried to create account twice, returning the existing one'
    )
    return account
  }

  let privateKey: string | undefined
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
    privateKey = keys.privateKey
    if (!privateKey) {
      throw new Error('Failed to convert mnemonic to hex')
    }

    const accountAddress: string = yield call(assignAccountFromPrivateKey, privateKey)
    if (!accountAddress) {
      throw new Error('Failed to assign account from private key')
    }

    yield call(storeMnemonic, mnemonic, accountAddress)

    return accountAddress
  } catch (error) {
    const sanitizedError = Logger.sanitizeError(error, privateKey)
    Logger.error(TAG + '@getOrCreateAccount', 'Error creating account', sanitizedError)
    throw new Error(ErrorMessages.ACCOUNT_SETUP_FAILED)
  }
}

export function* assignAccountFromPrivateKey(privateKey: string) {
  try {
    const account = privateKeyToAddress(privateKey)
    const wallet: RpcWallet = yield call(getConnectedWallet)
    const password: string = yield call(getPasswordSaga, account, false, true)

    try {
      yield call([wallet, wallet.addAccount], privateKey, password)
    } catch (e) {
      if (e === RpcWalletErrors.AccountAlreadyExists) {
        Logger.warn(TAG + '@assignAccountFromPrivateKey', 'Attempted to import same account')
      } else {
        Logger.error(TAG + '@assignAccountFromPrivateKey', 'Error importing raw key')
        throw e
      }

      yield call([wallet, wallet.unlockAccount], account, password, UNLOCK_DURATION)
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

export function* unlockAccount(account: string) {
  Logger.debug(TAG + '@unlockAccount', `Unlocking account: ${account}`)
  const wallet: RpcWallet = yield call(getConnectedWallet)
  if (wallet.isAccountUnlocked(account)) {
    return true
  }

  try {
    const password: string = yield call(getPasswordSaga, account)
    const result = yield call([wallet, wallet.unlockAccount], account, password, UNLOCK_DURATION)
    if (!result) {
      throw new Error('Unlock account result false')
    }

    Logger.debug(TAG + '@unlockAccount', `Account unlocked: ${account}`)
    return true
  } catch (error) {
    Logger.error(TAG + '@unlockAccount', 'Account unlock failed, clearing password caches', error)
    clearPasswordCaches()
    return false
  }
}

// Wait for geth to be connected and account ready
export function* getConnectedAccount() {
  yield call(waitForGethConnectivity)
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

export function* toggleFornoMode(action: SetIsFornoAction) {
  Logger.debug(TAG + '@toggleFornoMode', ` to: ${action.fornoMode}`)
  if ((yield select(fornoSelector)) !== action.fornoMode) {
    yield put(setContractKitReady(false)) // Lock contractKit during provider switch
    try {
      yield put(setFornoMode(action.fornoMode))
      yield put(cancelGethSaga())
      yield call(stopGethIfInitialized)
      yield spawn(gethSaga)
      yield call(waitForGethConnectivity)
    } catch (e) {
      Logger.error(TAG + '@switchToFornoFromGeth', 'Error switching to forno from geth')
      yield put(showError(ErrorMessages.FAILED_TO_SWITCH_SYNC_MODES))
    }
    yield put(setContractKitReady(true))
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
