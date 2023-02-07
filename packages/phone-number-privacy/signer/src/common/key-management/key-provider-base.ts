import { config } from '../../config'

export enum DefaultKeyName {
  PHONE_NUMBER_PRIVACY = 'phoneNumberPrivacy',
  DOMAINS = 'domains',
}
export interface Key {
  name: DefaultKeyName
  version: number
}
export interface KeyProvider {
  fetchPrivateKeyFromStore: (key: Key) => Promise<void>
  getPrivateKey: (key: Key) => string
  getPrivateKeyOrFetchFromStore: (key: Key) => Promise<string>
}

const PRIVATE_KEY_SIZE = 72

export abstract class KeyProviderBase implements KeyProvider {
  protected privateKeys: Map<string, string>

  constructor() {
    this.privateKeys = new Map()
  }

  public getPrivateKey(key: Key) {
    const privateKey = this.privateKeys.get(this.getCustomKeyVersionString(key))
    if (!privateKey) {
      throw new Error(`Private key is unavailable: ${key}`)
    }
    return privateKey
  }

  public async getPrivateKeyOrFetchFromStore(key: Key): Promise<string> {
    if (key.version < 0) {
      throw new Error('Invalid private key version. Key version must be a positive integer.')
    }
    try {
      return this.getPrivateKey(key)
    } catch {
      await this.fetchPrivateKeyFromStore(key)
      return this.getPrivateKey(key)
    }
  }

  public abstract fetchPrivateKeyFromStore(key: Key): Promise<void>

  getCustomKeyVersionString(key: Key): string {
    return `${this.getCustomKeyName(key)}-${key.version}`
  }

  protected setPrivateKey(key: Key, privateKey: string) {
    privateKey = privateKey ? privateKey.trim() : ''
    if (privateKey.length !== PRIVATE_KEY_SIZE) {
      throw new Error('Invalid private key')
    }
    this.privateKeys.set(this.getCustomKeyVersionString(key), privateKey)
  }

  protected getCustomKeyName(key: Key) {
    switch (key.name) {
      case DefaultKeyName.PHONE_NUMBER_PRIVACY:
        return config.keystore.keys.phoneNumberPrivacy.name || key.name
      case DefaultKeyName.DOMAINS:
        return config.keystore.keys.domains.name || key.name
      default:
        return key.name
    }
  }
}
