/**
 * Logic and utilities for managing account secrets
 * The pincode is a short numeric string the user is required to enter
 * The pepper is a generated once per account and stored in the keychain/keystore
 * The password is a combination of the two. It is used for unlocking the account in geth
 */

import { isValidAddress, normalizeAddress } from '@celo/utils/src/address'
import { sha256 } from 'ethereumjs-util'
import { asyncRandomBytes } from 'react-native-secure-randombytes'
import { call, select } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { UNLOCK_DURATION } from 'src/geth/consts'
import i18n from 'src/i18n'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  clearPasswordCaches,
  getCachedPassword,
  getCachedPasswordHash,
  getCachedPepper,
  getCachedPin,
  setCachedPassword,
  setCachedPasswordHash,
  setCachedPepper,
  setCachedPin,
} from 'src/pincode/PasswordCache'
import { removeStoredItem, retrieveStoredItem, storeItem } from 'src/storage/keychain'
import Logger from 'src/utils/Logger'
import { getWalletAsync } from 'src/web3/contracts'

const TAG = 'pincode/authentication'

enum STORAGE_KEYS {
  PEPPER = 'PEPPER',
  PASSWORD_HASH = 'PASSWORD_HASH',
}

const PEPPER_LENGTH = 64
export const PIN_LENGTH = 6
// Pepper and pin not currently generalized to be per account
// Using this value in the caches
export const DEFAULT_CACHE_ACCOUNT = 'default'

const PIN_BLACKLIST = [
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
  '654321',
]

export function isPinValid(pin: string) {
  return pin.length === PIN_LENGTH && !PIN_BLACKLIST.includes(pin)
}

export async function retrieveOrGeneratePepper() {
  if (!getCachedPepper(DEFAULT_CACHE_ACCOUNT)) {
    let storedPepper = await retrieveStoredItem(STORAGE_KEYS.PEPPER)
    if (!storedPepper) {
      const randomBytes = await asyncRandomBytes(PEPPER_LENGTH)
      const pepper = randomBytes.toString('hex')
      await storeItem({ key: STORAGE_KEYS.PEPPER, value: pepper })
      storedPepper = pepper
    }
    setCachedPepper(DEFAULT_CACHE_ACCOUNT, storedPepper)
  }
  return getCachedPepper(DEFAULT_CACHE_ACCOUNT)!
}

async function getPasswordForPin(pin: string) {
  const pepper = await retrieveOrGeneratePepper()
  const password = `${pepper}${pin}`
  return password
}

async function getPasswordHashForPin(pin: string) {
  const password = await getPasswordForPin(pin)
  return getPasswordHash(password)
}

function getPasswordHash(password: string) {
  return sha256(new Buffer(password, 'hex')).toString('hex')
}

function passwordHashStorageKey(account: string) {
  if (!isValidAddress(account)) {
    throw new Error('Expecting valid address for computing storage key')
  }
  return `${STORAGE_KEYS.PASSWORD_HASH}-${normalizeAddress(account)}`
}

function storePasswordHash(hash: string, account: string) {
  setCachedPasswordHash(account, hash)
  return storeItem({ key: passwordHashStorageKey(account), value: hash })
}

async function retrievePasswordHash(account: string) {
  if (!getCachedPasswordHash(account)) {
    let hash: string | null = null
    try {
      hash = await retrieveStoredItem(passwordHashStorageKey(account))
    } catch (err) {
      Logger.error(`${TAG}@retrievePasswordHash`, 'Error retrieving hash', err, true)
      return null
    }
    if (!hash) {
      Logger.warn(`${TAG}@retrievePasswordHash`, 'No password hash found in store')
      return null
    }
    setCachedPasswordHash(account, hash)
  }
  return getCachedPasswordHash(account)
}

export async function getPassword(
  account: string,
  withVerification: boolean = true,
  storeHash: boolean = false
) {
  let password = getCachedPassword(account)
  if (password) {
    return password
  }

  const pin = await getPincode(withVerification)
  password = await getPasswordForPin(pin)

  if (storeHash) {
    const hash = getPasswordHash(password)
    await storePasswordHash(hash, account)
  }

  setCachedPassword(account, password)
  return password
}

export function* getPasswordSaga(account: string, withVerification?: boolean, storeHash?: boolean) {
  const pincodeType = yield select(pincodeTypeSelector)

  if (pincodeType === PincodeType.Unset) {
    Logger.error(TAG + '@getPincode', 'Pin has never been set')
    ValoraAnalytics.track(OnboardingEvents.pin_never_set)
    throw Error('Pin has never been set')
  }

  if (pincodeType !== PincodeType.CustomPin) {
    throw new Error(`Unsupported Pincode Type ${pincodeType}`)
  }

  return yield call(getPassword, account, withVerification, storeHash)
}

type PinCallback = (pin: string) => void

// Retrieve the pincode value
// May trigger the pincode enter screen
export async function getPincode(withVerification = true) {
  const cachedPin = getCachedPin(DEFAULT_CACHE_ACCOUNT)
  if (cachedPin) {
    return cachedPin
  }

  const pin = await requestPincodeInput(withVerification, true)
  return pin
}

// Navigate to the pincode enter screen and check pin
export async function requestPincodeInput(withVerification = true, shouldNavigateBack = true) {
  const pin = await new Promise((resolve: PinCallback, reject: () => void) => {
    navigate(Screens.PincodeEnter, {
      onSuccess: resolve,
      onCancel: reject,
      withVerification,
    })
  })

  if (shouldNavigateBack) {
    navigateBack()
  }

  if (!pin) {
    throw new Error('Pincode confirmation returned empty pin')
  }

  setCachedPin(DEFAULT_CACHE_ACCOUNT, pin)
  return pin
}

// Confirm pin is correct by checking it against the stored password hash
export async function checkPin(pin: string, account: string) {
  const hashForPin = await getPasswordHashForPin(pin)
  const correctHash = await retrievePasswordHash(account)

  if (!correctHash) {
    Logger.warn(`${TAG}@checkPin`, 'No password hash stored. Checking with rpcWallet instead.')
    const password = await getPasswordForPin(pin)
    const unlocked = await ensureCorrectPassword(password, account)
    if (unlocked) {
      await storePasswordHash(hashForPin, account)
      return true
    }
    return false
  }

  return hashForPin === correctHash
}

// Confirm password by actually attempting to unlock the account
export async function ensureCorrectPassword(
  password: string,
  currentAccount: string
): Promise<boolean> {
  try {
    const wallet = await getWalletAsync()
    const result = await wallet.unlockAccount(currentAccount, password, UNLOCK_DURATION)
    return result
  } catch (error) {
    Logger.error(TAG, 'Error attempting to unlock wallet', error, true)
    Logger.showError(i18n.t(ErrorMessages.ACCOUNT_UNLOCK_FAILED))
    return false
  }
}

export async function removeAccountLocally(account: string) {
  clearPasswordCaches()
  return Promise.all([
    removeStoredItem(STORAGE_KEYS.PEPPER),
    removeStoredItem(passwordHashStorageKey(account)),
  ])
}
