import { generateKeys, generateMnemonic, MnemonicStrength } from '@celo/utils/src/account'
import { deriveCEK } from '@celo/utils/src/commentEncryption'
import * as Sentry from '@sentry/react-native'
import { NativeEventEmitter, NativeModules } from 'react-native'
import * as bip39 from 'react-native-bip39'
import { REHYDRATE } from 'redux-persist'
import { eventChannel } from 'redux-saga'
import { call, cancel, cancelled, delay, fork, put, race, select, take } from 'redux-saga/effects'
import { setAccountCreationTime, setPromptForno } from 'src/account/actions'
import { getPincode } from 'src/account/saga'
import { promptFornoIfNeededSelector } from 'src/account/selectors'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { waitForRehydrate } from 'src/app/saga'
import { getWordlist } from 'src/backup/utils'
import {
  Actions,
  setAccount,
  setAccountInGethKeystore,
  setGethConnected,
  setInitState,
  setPrivateCommentKey,
} from 'src/geth/actions'
import {
  FailedToFetchGenesisBlockError,
  FailedToFetchStaticNodesError,
  getGeth,
} from 'src/geth/geth'
import { InitializationState } from 'src/geth/reducer'
import { currentAccountSelector, isGethConnectedSelector } from 'src/geth/selectors'
import { navigate, navigateToError } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { setCachedPincode } from 'src/pincode/PincodeCache'
import { deleteChainDataAndRestartApp } from 'src/utils/AppRestart'
import { setKey } from 'src/utils/keyStore'
import Logger from 'src/utils/Logger'
import { setContractKitReady } from 'src/web3/actions'
import { fornoSelector } from 'src/web3/selectors'

const gethEmitter = new NativeEventEmitter(NativeModules.RNGeth)

const TAG = 'geth/saga'
const INIT_GETH_TIMEOUT = 15000
const NEW_BLOCK_TIMEOUT = 30000
const GETH_MONITOR_DELAY = 5000

enum GethInitOutcomes {
  SUCCESS = 'SUCCESS',
  NETWORK_ERROR_FETCHING_STATIC_NODES = 'NETWORK_ERROR_FETCHING_STATIC_NODES',
  IRRECOVERABLE_FAILURE = 'IRRECOVERABLE_FAILURE',
  NETWORK_ERROR_FETCHING_GENESIS_BLOCK = 'NETWORK_ERROR_FETCHING_GENESIS_BLOCK',
}

export function* waitForGethConnectivity() {
  const connected = yield select(isGethConnectedSelector)
  if (connected) {
    return
  }
  while (true) {
    const action = yield take(Actions.SET_GETH_CONNECTED)
    if (action.connected) {
      return
    }
  }
}

function* waitForGethInstance() {
  try {
    const gethInstance = yield call(getGeth)
    if (gethInstance == null) {
      throw new Error('geth instance is null')
    }
    return GethInitOutcomes.SUCCESS
  } catch (error) {
    switch (error) {
      case FailedToFetchStaticNodesError:
        return GethInitOutcomes.NETWORK_ERROR_FETCHING_STATIC_NODES
      case FailedToFetchGenesisBlockError:
        return GethInitOutcomes.NETWORK_ERROR_FETCHING_GENESIS_BLOCK
      default: {
        Logger.error(TAG, 'Error getting geth instance', error)
        return GethInitOutcomes.IRRECOVERABLE_FAILURE
      }
    }
  }
}

export function* initGethSaga() {
  Logger.debug(TAG, 'Initializing Geth')
  yield put(setInitState(InitializationState.INITIALIZING))

  const { result } = yield race({
    result: call(waitForGethInstance),
    timeout: delay(INIT_GETH_TIMEOUT),
  })

  let restartAppAutomatically: boolean = false
  switch (result) {
    case GethInitOutcomes.SUCCESS: {
      Logger.debug(TAG, 'Geth initialized')
      yield put(setInitState(InitializationState.INITIALIZED))
      return
    }
    case GethInitOutcomes.NETWORK_ERROR_FETCHING_STATIC_NODES: {
      Logger.error(
        TAG,
        'Could not fetch static nodes from the network. Tell user to check data connection.'
      )
      yield put(setInitState(InitializationState.DATA_CONNECTION_MISSING_ERROR))
      restartAppAutomatically = false
      break
    }
    case GethInitOutcomes.NETWORK_ERROR_FETCHING_GENESIS_BLOCK: {
      Logger.error(
        TAG,
        'Could not fetch genesis block from the network. Tell user to check data connection.'
      )
      yield put(setInitState(InitializationState.DATA_CONNECTION_MISSING_ERROR))
      restartAppAutomatically = false
      break
    }
    case GethInitOutcomes.IRRECOVERABLE_FAILURE: {
      Logger.error(TAG, 'Could not initialize geth. Will retry.')
      yield put(setInitState(InitializationState.INITIALIZE_ERROR))
      restartAppAutomatically = true
      break
    }
    // We assume it's a timeout if it hits this case. It's possible though, if
    // a new enum value is added to GethInitOutcomes and doesn't have a case added
    // for it, the error will be misleading.
    default: {
      Logger.error(TAG, 'Geth initializtion timed out. Will retry.')
      yield put(setInitState(InitializationState.INITIALIZE_ERROR))
      restartAppAutomatically = true
    }
  }

  if (restartAppAutomatically) {
    Logger.error(TAG, 'Geth initialization failed, restarting the app.')
    deleteChainDataAndRestartApp()
  } else {
    // Suggest switch to forno for network-related errors
    if (yield select(promptFornoIfNeededSelector)) {
      yield put(setPromptForno(false))
      navigate(Screens.DataSaver, { promptModalVisible: true })
    } else {
      navigateToError('networkConnectionFailed')
    }
  }
}

function createNewBlockChannel() {
  return eventChannel((emit: any) => {
    const eventSubscription = gethEmitter.addListener('GethNewHead', emit)
    return eventSubscription.remove
  })
}

function* monitorGeth() {
  const newBlockChannel = yield createNewBlockChannel()

  while (true) {
    try {
      const { newBlock } = yield race({
        newBlock: take(newBlockChannel),
        timeout: delay(NEW_BLOCK_TIMEOUT),
      })
      if (newBlock) {
        Logger.debug(`${TAG}@monitorGeth`, 'Received new blocks')
        yield put(setGethConnected(true))
        yield delay(GETH_MONITOR_DELAY)
      } else {
        Logger.error(
          `${TAG}@monitorGeth`,
          `Did not receive a block in ${NEW_BLOCK_TIMEOUT} milliseconds`
        )
        yield put(setGethConnected(false))
      }
    } catch (error) {
      Logger.error(`${TAG}@monitorGeth`, error)
    } finally {
      if (yield cancelled()) {
        try {
          newBlockChannel.close()
        } catch (error) {
          Logger.debug(
            `${TAG}@monitorGeth`,
            'Could not close newBlockChannel. May already be closed.',
            error
          )
        }
      }
    }
  }
}

export function* gethSaga() {
  yield call(initGethSaga)
  const gethRelatedSagas = yield fork(monitorGeth)
  yield take(Actions.CANCEL_GETH_SAGA)
  yield cancel(gethRelatedSagas)
  yield put(setGethConnected(true))
}

export function* gethSagaIfNecessary() {
  yield call(waitForRehydrate) // Wait for rehydrate to know if geth or forno mode
  yield put(setContractKitReady(true)) // ContractKit is blocked (not ready) before rehydrate
  if (!(yield select(fornoSelector))) {
    Logger.debug(`${TAG}@gethSagaIfNecessary`, `Starting geth saga...`)
    yield call(gethSaga)
  }
}

const MNEMONIC_BIT_LENGTH = MnemonicStrength.s256_24words

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
    let duplicateInMnemonic = true
    do {
      Logger.debug(TAG + '@getOrCreateAccount', 'Regenerating mnemonic to avoid duplicates')
      mnemonic = yield call(generateMnemonic, MNEMONIC_BIT_LENGTH, wordlist, bip39)
      duplicateInMnemonic = checkDuplicate(mnemonic)
    } while (duplicateInMnemonic)

    if (!mnemonic) {
      throw new Error('Failed to generate mnemonic')
    }

    // TODO(yorke): consider using address index parameter
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

    // NOTE: currentAccount can be null
    const currentAccount = yield select(currentAccountSelector)
    const account = yield call(addAccountToGethKeystore, privateKey, currentAccount, pincode)
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

// Stores account and private key in geth keystore
export function* addAccountToGethKeystore(key: string, currentAccount: string, pincode: string) {
  Logger.debug(TAG + '@addAccountToGethKeystore', `using key ${key} for account ${currentAccount}`)

  let account: string
  try {
    const gethInstance = yield call(getGeth)
    // TODO(yorke): account for pincode changes
    account = gethInstance.importKey(key, pincode, pincode)
    Logger.debug(
      TAG + '@addAccountToGethKeystore',
      `Successfully imported raw key for account ${account}`
    )
    yield put(setAccountInGethKeystore(account))
  } catch (e) {
    Logger.error(TAG + '@addAccountToGethKeystore', 'Failed to import raw key', e)
    if (e.toString().includes('account already exists')) {
      account = currentAccount
      Logger.debug(TAG + '@addAccountToGethKeystore', 'Importing same account as current one')
    } else {
      Logger.error(TAG + '@addAccountToGethKeystore', 'Error importing raw key')
      throw e
    }
  }

  return account
}

export function* unlockAccount(account: string) {
  Logger.debug(TAG + '@unlockAccount', `Unlocking account: ${account}`)

  try {
    const pincode = yield call(getPincode, true)
    const geth = yield call(getGeth)
    return geth.unlockAccount(account, pincode)
  } catch (error) {
    setCachedPincode(null)
    Logger.error(TAG + '@unlockAccount', 'Geth account unlock failed', error)
    return false
  }
}

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
