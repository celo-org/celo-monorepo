import * as Sentry from '@sentry/react-native'
import RNSecureKeyStore, { ACCESSIBLE } from 'react-native-secure-key-store'
import Logger from 'src/utils/Logger'

const TAG = 'utils/keystore'

export async function setKey(key: string, value: string) {
  try {
    Logger.debug(TAG, `Setting key ${key} in keystore`)
    // TODO(Rossy + Jean): Revisit this accessible setting
    await RNSecureKeyStore.set(key, value, {
      accessible: ACCESSIBLE.WHEN_UNLOCKED,
    })
    Logger.debug(TAG, `Key ${key} set in keystore`)
  } catch (error) {
    Logger.error(TAG, `Error setting key ${key} in keystore`, error)
    // Capturing error in sentry for now as we debug backup key issue
    Sentry.captureException(error)
    throw error
  }
}

export async function getKey(key: string) {
  try {
    Logger.debug(TAG, `Getting key ${key} from keystore`)
    const value = await RNSecureKeyStore.get(key)
    Logger.debug(TAG, `Key ${key} retrieved from keystore`)
    return value
  } catch (error) {
    Logger.error(TAG, `Error getting key ${key} from keystore`, error)
    // Capturing error in sentry for now as we debug backup key issue
    Sentry.captureException(error)
    throw error
  }
}
