import * as Keychain from 'react-native-keychain'

interface SecureStorage {
  key: string
  value: string
}

export async function storeItem({ key, value }: SecureStorage) {
  return Keychain.setGenericPassword('CELO', value, {
    service: key,
    accessible: Keychain.ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
    rules: Keychain.SECURITY_RULES.NONE,
  })
}

export async function retrieveStoredItem(key: string) {
  return null
  const item = await Keychain.getGenericPassword({
    service: key,
  })
  if (!item) {
    return null
  }
  return item.password
}
