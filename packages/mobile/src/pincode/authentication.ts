import { sha256 } from 'ethereumjs-util'
import { asyncRandomBytes } from 'react-native-secure-randombytes'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  getCachedPassword,
  getCachedPasswordHash,
  getCachedPepper,
  getCachedPin,
  setCachedPasswordHash,
  setCachedPepper,
} from 'src/pincode/PasswordCache'
import { ensureCorrectPin } from 'src/pincode/utils'
import { store } from 'src/redux/store'
import { retrieveStoredItem, storeItem } from 'src/storage/keychain'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'pincode/authentication'
enum STORAGE_KEYS {
  PEPPER = 'PEPPER',
  PASSWORD_HASH = 'PASSWORD_HASH',
}
const PEPPER_LENGTH = 64
export const PIN_LENGTH = 6

export function isPinValid(pin: string) {
  return pin.length === PIN_LENGTH
}

function pinStorageKey(account: string) {
  return `${STORAGE_KEYS.PASSWORD_HASH}-${account}`
}

export async function retrieveOrGeneratePepper() {
  if (!getCachedPepper()) {
    let storedPepper = await retrieveStoredItem(STORAGE_KEYS.PEPPER)
    if (!storedPepper) {
      const randomBytes = await asyncRandomBytes(PEPPER_LENGTH)
      const pepper = randomBytes.toString('hex')
      await storeItem({ key: STORAGE_KEYS.PEPPER, value: pepper })
      storedPepper = pepper
    }
    setCachedPepper(storedPepper)
  }
  return getCachedPepper() as string
}

async function hashForPin(pin: string) {
  return sha256(new Buffer(await passwordForPin(pin), 'hex')).toString('hex')
}

export async function storePasswordHash(pin: string, account: string) {
  const hash = await hashForPin(pin)
  await storeItem({ key: pinStorageKey(account), value: hash })
}

export async function checkPin(pin: string, account: string) {
  const hash = await hashForPin(pin)
  const passwordHash = await retrievePasswordHash(account)
  if (!passwordHash) {
    Logger.error(`${TAG}@checkPin`, 'No password hash stored')
    const currentAccount = currentAccountSelector(store.getState())
    if (!currentAccount) {
      throw new Error('No account to unlock')
    }
    const unlocked = await ensureCorrectPin(await passwordForPin(pin), currentAccount)
    if (unlocked) {
      await storePasswordHash(pin, account)
      return true
    }
    return false
  }
  return hash === passwordHash
}

export async function passwordForPin(pin: string) {
  const pepper = await retrieveOrGeneratePepper()
  const password = `${pepper}${pin}`
  return password
}

async function retrievePasswordHash(account: string) {
  if (!getCachedPasswordHash(account)) {
    let hash: string | null = null
    try {
      hash = await retrieveStoredItem(pinStorageKey(account))
    } catch (err) {
      Logger.error(`${TAG}@retrievePasswordHash`, err)
      return null
    }
    if (!hash) {
      return null
    }
    setCachedPasswordHash(account, hash)
  }
  return getCachedPasswordHash(account)
}

type PinPromise = (pin: string) => void

export async function getPincode(withVerification = true) {
  const pincodeType = pincodeTypeSelector(store.getState())

  if (pincodeType === PincodeType.Unset) {
    Logger.error(TAG + '@getPincode', 'Pin has never been set')
    CeloAnalytics.track(CustomEventNames.pin_never_set, { pincodeType })
    throw Error('Pin has never been set')
  }

  if (pincodeType === PincodeType.CustomPin) {
    Logger.debug(TAG + '@getPincode', 'Getting custom pin')
    const cachedPin = getCachedPin()
    if (cachedPin) {
      return cachedPin
    }

    const pin = await new Promise((resolve: PinPromise) => {
      navigate(Screens.PincodeEnter, {
        onSuccess: resolve,
        withVerification,
      })
    })

    navigateBack()

    if (!pin) {
      throw new Error('Pincode confirmation returned empty pin')
    }

    return pin
  }
}

export async function getPassword(account: string, withVerification: boolean = true) {
  let password = await getCachedPassword(account)
  if (password) {
    return password
  }

  const pin = await getPincode(withVerification)
  if (pin) {
    password = await passwordForPin(pin)
    return password
  }
  return null
}
