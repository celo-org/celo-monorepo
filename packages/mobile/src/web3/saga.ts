import { deriveCEK } from '@celo/utils/src/commentEncryption'
import { AsyncStorage } from 'react-native'
import { generateMnemonic, mnemonicToSeedHex } from 'react-native-bip39'
import { REHYDRATE } from 'redux-persist/es/constants'
import { call, put, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { getPincode } from 'src/account'
import { setAccountCreationTime } from 'src/account/actions'
import { pincodeSelector } from 'src/account/reducer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { getWordlist } from 'src/backup/utils'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { waitForGethConnectivity } from 'src/geth/saga'
import Logger from 'src/utils/Logger'
import { Actions, setAccount, setPrivateCommentKey, unlockAccount } from 'src/web3/actions'
import { web3 } from 'src/web3/contracts'
import { refreshGasPrice } from 'src/web3/gas'
import { currentAccountSelector } from 'src/web3/selectors'

const ETH_PRIVATE_KEY_LENGTH = 64
const MNEMONIC_BIT_LENGTH = (ETH_PRIVATE_KEY_LENGTH * 8) / 2

const TAG = 'web3/saga'

let AssignAccountLock = false

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
    yield put(setAccountCreationTime())
    yield call(assignDataKeyFromPrivateKey, key)

    web3.eth.defaultAccount = account
    AssignAccountLock = false
    return account
  } catch (e) {
    Logger.error(TAG, `@assignAccountFromPrivateKey: ${e}`)
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
  yield waitForGethConnectivity()
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
