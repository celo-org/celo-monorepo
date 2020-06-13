import * as Keychain from 'react-native-keychain'
import { asyncRandomBytes } from 'react-native-secure-randombytes'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'
import { getContractKitOutsideGenerator, web3ForUtils } from 'src/web3/contracts'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'pincode/PhoneAuthUtils'
const PEPPER = 'PEPPER'
const PASSPHRASE_HASH = 'PASSPHRASE_HASH'
const PEPPER_LENGTH = 64

let cachedPepper: string
let cachedPassphraseHash: string

interface SecureStorage {
  key: string
  value: string
}

async function securelyStoreItem({ key, value }: SecureStorage) {
  return Keychain.setGenericPassword('', value, {
    service: key,
    accessible: Keychain.ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
    rules: Keychain.SECURITY_RULES.NONE,
  })
}

async function retrieveOrGeneratePepper() {
  if (cachedPepper) {
    return cachedPepper
  }
  const storedPepper = await Keychain.getGenericPassword({
    service: PEPPER,
  })
  if (!storedPepper) {
    const pepper = await asyncRandomBytes(PEPPER_LENGTH)
    await securelyStoreItem({ key: PEPPER, value: pepper })
    cachedPepper = pepper
    return cachedPepper
  }
  cachedPepper = storedPepper.password
  return cachedPepper
}

async function storePassphraseHash(pin: string) {
  const pepper = await retrieveOrGeneratePepper()
  const hash = web3ForUtils.utils.sha3(pin + pepper)
  await securelyStoreItem({ key: PASSPHRASE_HASH, value: hash })
}

async function checkPin(pin: string) {
  const pepper = await retrieveOrGeneratePepper()
  const hash = web3ForUtils.utils.sha3(pin + pepper)
  const passphraseHash = await retrievePassphraseHash()
  if (!passphraseHash) {
    Logger.error(`${TAG}@checkPin`, 'No passphrase hash stored')
    const contractKit = await getContractKitOutsideGenerator()
    const currentAccount = currentAccountSelector(store.getState())
    if (!currentAccount) {
      throw new Error('No account to unlock')
    }
    const unlocked = await contractKit.web3.eth.personal.unlockAccount(currentAccount, pin, 1)
    if (unlocked) {
      await storePassphraseHash(pin)
      return true
    }
    return false
  }
  if (hash === passphraseHash) {
    return true
  }
  return false
}

async function retrievePassphraseHash() {
  if (cachedPassphraseHash) {
    return cachedPassphraseHash
  }
  let credentials: false | Keychain.SharedWebCredentials
  try {
    credentials = await Keychain.getGenericPassword({ service: PASSPHRASE_HASH })
  } catch (err) {
    Logger.error(`${TAG}@retrievePassphraseHash`, err)
    return null
  }
  if (!credentials) {
    return null
  }
  cachedPassphraseHash = credentials.password
  return cachedPassphraseHash
}
