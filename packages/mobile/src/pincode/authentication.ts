import { sha256 } from 'ethereumjs-util'
import { asyncRandomBytes } from 'react-native-secure-randombytes'
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

let cachedPepper: string
const cachedPasswordHashes: {
  [account: string]: string
} = {}

export function isPinValid(pin: string) {
  return pin.length === PIN_LENGTH
}

function pinStorageKey(account: string) {
  return `${STORAGE_KEYS.PASSWORD_HASH}-${account}`
}

async function retrieveOrGeneratePepper() {
  if (cachedPepper) {
    return cachedPepper
  }
  const storedPepper = await retrieveStoredItem(STORAGE_KEYS.PEPPER)
  if (!storedPepper) {
    const randomBytes = await asyncRandomBytes(PEPPER_LENGTH)
    const pepper = randomBytes.toString('hex')
    await storeItem({ key: STORAGE_KEYS.PEPPER, value: pepper })
    cachedPepper = pepper
    return cachedPepper
  }
  cachedPepper = storedPepper
  return cachedPepper
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
  if (hash === passwordHash) {
    return true
  }
  return false
}

export async function passwordForPin(pin: string) {
  const pepper = await retrieveOrGeneratePepper()
  const password = `${pepper}${pin}`
  return password
}

async function retrievePasswordHash(account: string) {
  if (cachedPasswordHashes[account]) {
    return cachedPasswordHashes[account]
  }
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
  cachedPasswordHashes[account] = hash
  return cachedPasswordHashes[account]
}
