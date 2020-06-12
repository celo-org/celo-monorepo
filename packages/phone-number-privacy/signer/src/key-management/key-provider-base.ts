import { DEV_MODE, DEV_PRIVATE_KEY } from '../config'

export interface KeyProvider {
  getPrivateKey: () => Promise<string>
}

export abstract class KeyProviderBase implements KeyProvider {
  protected privateKey: string | null = null

  public async getPrivateKey() {
    if (DEV_MODE) {
      return DEV_PRIVATE_KEY
    }

    if (this.privateKey) {
      return this.privateKey
    }

    return this.fetchPrivateKeyFromStore()
  }

  protected setPrivateKey(key: string) {
    if (!key || key.length < 40) {
      throw new Error('Invalid private key')
    }
    this.privateKey = key
  }

  protected abstract async fetchPrivateKeyFromStore(): Promise<string>
}
