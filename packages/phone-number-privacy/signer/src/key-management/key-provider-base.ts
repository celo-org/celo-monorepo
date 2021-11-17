import { KeyName } from '@celo/phone-number-privacy-common'
import config from '../config'
export interface Key {
  name: KeyName
  version: number
}
export interface KeyProvider {
  fetchPrivateKeyFromStore: (key: Key) => Promise<void>
  getPrivateKey: (key: Key) => string
  getPrivateKeyOrFetchFromStore: (key: Key) => Promise<string>
}

const PRIVATE_KEY_SIZE = 72

export abstract class KeyProviderBase implements KeyProvider {
  protected privateKeys: Map<Key, string> = new Map()

  public getPrivateKey(key: Key) {
    const privateKey = this.privateKeys.get(key)
    if (!privateKey) {
      throw new Error(`Private key is unavailable: ${JSON.stringify(key)}`)
    }
    return privateKey
  }

  public async getPrivateKeyOrFetchFromStore(key: Key): Promise<string> {
    if (key.version < 1) {
      throw new Error('Invalid private key version')
    }
    try {
      return this.getPrivateKey(key)
    } catch {
      await this.fetchPrivateKeyFromStore(key)
      return this.getPrivateKey(key)
    }
  }

  public abstract fetchPrivateKeyFromStore(key: Key): Promise<void>

  protected setPrivateKey(key: Key, privateKey: string) {
    privateKey = privateKey ? privateKey.trim() : ''
    if (privateKey.length !== PRIVATE_KEY_SIZE) {
      throw new Error('Invalid private key')
    }
    this.privateKeys.set(key, privateKey)
  }

  protected getCustomKeyName(key: Key) {
    switch (key.name) {
      case KeyName.phoneNumberPrivacy:
        return config.keystore.keys.phoneNumberPrivacy.name || key.name
      case KeyName.domains:
        return config.keystore.keys.domains.name || key.name
      default:
        return key.name
    }
  }
}
