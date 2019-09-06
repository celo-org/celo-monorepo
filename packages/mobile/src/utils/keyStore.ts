import RNSecureKeyStore, { ACCESSIBLE } from 'react-native-secure-key-store'

export async function setKey(key: string, value: string) {
  return RNSecureKeyStore.set(key, value, { accessible: ACCESSIBLE.WHEN_UNLOCKED })
}

export async function getKey(key: string) {
  return RNSecureKeyStore.get(key)
}

export async function removeKey(key: string) {
  return RNSecureKeyStore.remove(key)
}
