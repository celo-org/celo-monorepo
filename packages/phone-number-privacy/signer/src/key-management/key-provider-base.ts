export interface KeyProvider {
  fetchPrivateKeyFromStore: () => Promise<void>
  getPrivateKey: () => string
}

export abstract class KeyProviderBase implements KeyProvider {
  protected privateKey: string | null = null

  public getPrivateKey() {
    if (!this.privateKey) {
      throw new Error('Private key is empty, provider not properly initialized')
    }

    return this.privateKey
  }

  public abstract async fetchPrivateKeyFromStore(): Promise<void>

  protected setPrivateKey(key: string) {
    if (!key || key.length < 40) {
      throw new Error('Invalid private key')
    }
    this.privateKey = key
  }
}
