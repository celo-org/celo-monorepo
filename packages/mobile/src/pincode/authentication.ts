import { asyncRandomBytes } from 'react-native-secure-randombytes'
import { store } from 'src/redux/store'
import { retrieveStoredItem, storeItem } from 'src/storage/keychain'
import Logger from 'src/utils/Logger'
import { getContractKitOutsideGenerator, web3ForUtils } from 'src/web3/contracts'
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
    const pepper = randomBytes.toString()
    await storeItem({ key: STORAGE_KEYS.PEPPER, value: pepper })
    cachedPepper = pepper
    return cachedPepper
  }
  cachedPepper = storedPepper
  return cachedPepper
}

export async function storePasswordHash(pin: string, account: string) {
  const pepper = await retrieveOrGeneratePepper()
  const hash = web3ForUtils.utils.sha3(pin + pepper)
  await storeItem({ key: pinStorageKey(account), value: hash })
}

export async function checkPin(pin: string, account: string) {
  const pepper = await retrieveOrGeneratePepper()
  const hash = web3ForUtils.utils.sha3(pin + pepper)
  const passwordHash = await retrievePasswordHash(account)
  if (!passwordHash) {
    Logger.error(`${TAG}@checkPin`, 'No password hash stored')
    const contractKit = await getContractKitOutsideGenerator()
    const currentAccount = currentAccountSelector(store.getState())
    if (!currentAccount) {
      throw new Error('No account to unlock')
    }
    const unlocked = await contractKit.web3.eth.personal.unlockAccount(currentAccount, pin, 1)
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
  return `${pepper}${pin}`
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
