import { KeystoreBase } from './keystore-base'

export class InMemoryKeystore extends KeystoreBase {
  /**
   * Used for mocking keystore operations in unit tests
   */
  private _storage: Record<string, string> = {}

  // Implements required abstract class methods
  persistKeystore(keystoreName: string, keystore: string) {
    this._storage[keystoreName] = keystore
  }

  getRawKeystore(keystoreName: string): string {
    return this._storage[keystoreName]
  }

  async getAllKeystoreNames(): Promise<string[]> {
    return Object.keys(this._storage)
  }

  removeKeystore(keystoreName: string) {
    delete this._storage[keystoreName]
  }
}
