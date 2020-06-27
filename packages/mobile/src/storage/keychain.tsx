import * as Keychain from 'react-native-keychain'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Logger from 'src/utils/Logger'

const TAG = 'storage/keychain'

interface SecureStorage {
  key: string
  value: string
}

export async function storeItem({ key, value }: SecureStorage) {
  try {
    const result = await Keychain.setGenericPassword('CELO', value, {
      service: key,
      accessible: Keychain.ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
      rules: Keychain.SECURITY_RULES.NONE,
    })
    if (result === false) {
      throw new Error('Result false')
    }
    return result
  } catch (error) {
    const sanitizedError = Logger.sanitizeError(error, value)
    Logger.error(TAG, 'Error storing item', sanitizedError)
    throw new Error(ErrorMessages.KEYCHAIN_STORAGE_ERROR)
  }
}

export async function retrieveStoredItem(key: string) {
  try {
    const item = await Keychain.getGenericPassword({
      service: key,
    })
    if (!item) {
      return null
    }
    return item.password
  } catch (error) {
    const sanitizedError = Logger.sanitizeError(error)
    Logger.error(TAG, 'Error retrieving stored item', sanitizedError)
    throw new Error(ErrorMessages.KEYCHAIN_STORAGE_ERROR)
  }
}
